# Communications System — Design Spec

**Date:** 2026-08-29
**Status:** Approved for planning
**Scope:** New backend subsystem + new frontend page. Architectural.

---

## 1. Purpose

Give pelvi-admin operators a way to broadcast operational notices (scheduled
maintenance, incidents, generic announcements) to customer organizations by
email. One dispatch reaches many organizations, selected by filter. Delivery
target is `Organization.email` (one address per org).

Out of back-office operator use only. Not a marketing tool, not a per-org
transactional mailer.

---

## 2. Decisions (locked)

| Dimension | Decision |
|---|---|
| Delivery mechanism | Transactional provider — **Resend** |
| Provider isolation | Thin `ResendMailService` seam wraps the SDK (matches `ClinicApiService` pattern) |
| Recipient selection | Broadcast with filters (org status, subscription status, plan) |
| Composition | Predefined templates with structured fields — templates live in code |
| Scheduling | Immediate send only. No scheduler, no worker, no queue. |
| Persistence | None. Fire-and-forget. No new tables. One `logger.info` line per dispatch. |
| Send shape | One Resend `batch` call, one personalized message per org (< 50 recipients fits the 100-message batch limit) |
| Authorization | `SUPER_ADMIN` only |
| Safeguards | Rendered preview + recipient count + confirmation modal before send |

### Explicitly rejected

- Templates in DB + CRUD screen — too much surface for 3 fixed types.
- Free-form markdown composer — contradicts the structured-fields decision.
- Per-recipient delivery tracking / bounce webhooks — fire-and-forget chosen.
- Scheduled / future-dated sends — immediate only.
- Background queue / worker — scale is < 50 recipients, one batch call.
- "Billing" template — billing data is per-org, does not fit a broadcast.
  `ANNOUNCEMENT` covers ad-hoc notices.

---

## 3. Templates (MVP)

Three types. Each type = a field schema + a render function, both in backend TS,
with a mirrored Zod schema on the frontend.

### 3.1 `MAINTENANCE` — scheduled maintenance window

| Field | Type | Notes |
|---|---|---|
| `startsAt` | ISO datetime | window start |
| `endsAt` | ISO datetime | window end; must be after `startsAt` |
| `affectedAreas` | string (1–200) | plain text, e.g. "Agenda e prontuário" |
| `expectedImpact` | enum: `NONE` \| `DEGRADED` \| `DOWNTIME` | |
| `notes` | markdown string, optional (≤ 2000) | extra context |

### 3.2 `INCIDENT` — incident / degradation notice

| Field | Type | Notes |
|---|---|---|
| `title` | string (1–120) | |
| `status` | enum: `INVESTIGATING` \| `IDENTIFIED` \| `MONITORING` \| `RESOLVED` | |
| `startedAt` | ISO datetime | when the incident began |
| `description` | markdown string (1–2000) | |

### 3.3 `ANNOUNCEMENT` — generic operational announcement

| Field | Type | Notes |
|---|---|---|
| `title` | string (1–120) | |
| `body` | markdown string (1–4000) | |

### 3.4 Automatic variables

Injected by the renderer, not entered by the operator:

- `organizationName` — `Organization.name`, used in the greeting.

### 3.5 Rendering rules

- One base email layout: Pelvi header + footer, all CSS inlined (email clients
  strip `<style>`). Per-type body slots into the layout.
- Dates formatted pt-BR, timezone `America/Sao_Paulo`
  (e.g. "29/08/2026 das 22h00 às 23h30").
- Markdown fields rendered to HTML and sanitized (allowlist: `p`, `br`, `strong`,
  `em`, `ul`/`ol`/`li`, `a[href]`). No raw HTML passthrough, no script/style/img.
- Subject line derived per type:
  - `MAINTENANCE` → `Manutenção programada — {affectedAreas}`
  - `INCIDENT` → `[{status}] {title}`
  - `ANNOUNCEMENT` → `{title}`
- Plain-text alternative generated from the same data (deliverability).

---

## 4. Recipient filters

Filter shape (all fields optional; omitted = no constraint on that dimension):

| Filter | Type | Source |
|---|---|---|
| `orgStatus` | `OrgStatus[]` (`ACTIVE`, `SUSPENDED`, `CANCELED`) | `Organization.status` |
| `subscriptionStatus` | `SubscriptionStatus[]` (`TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELED`) | any `Subscription` of the org |
| `planId` | `string[]` | any `Subscription` of the org |

Rules:

- Empty filter object → **defaults to `orgStatus: ['ACTIVE']`** (guard against
  accidental send to churned/suspended orgs). The frontend pre-selects this and
  the backend applies it when `orgStatus` is absent.
- Recipients = distinct, non-empty `Organization.email` across matching orgs.
- Duplicate emails collapsed to one message.
- If an org has multiple subscriptions, it matches when **any** subscription
  satisfies the `subscriptionStatus` / `planId` constraints.

---

## 5. Backend — module `communications/`

Global prefix already `/api/admin`. Routes under `/api/admin/communications`.

```
backend/src/communications/
  dto/
    communication-payload.dto.ts     discriminated union on `type`; per-type field DTOs with class-validator
    send-communication.dto.ts        { payload, filters }
    preview-communication.dto.ts     { payload, filters }
  domain/
    template.ts                      TemplateType enum, per-type field interfaces
    template-registry.ts             type → { validate, render(payload, ctx) => { subject, html, text } }
    recipient-filter.ts              RecipientFilter type
  application/
    resolve-recipients.usecase.ts    (filter) => { emails: string[], count: number }
    render-communication.ts          (payload, { organizationName }) => { subject, html, text }
    preview-communication.usecase.ts (payload, filter) => { subject, html, recipientCount }
    send-communication.usecase.ts    resolve → render per org → mail.sendBatch → { sent, failed }
  infra/
    resend-mail.service.ts           wraps `resend` SDK; sendBatch(messages: MailMessage[])
  communications.controller.ts       @UseGuards(JwtAuthGuard, RolesGuard) @Roles(AdminRole.SUPER_ADMIN)
  communications.module.ts
```

### 5.1 Endpoints

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/communications/preview` | `{ payload, filters }` | `{ subject, html, recipientCount }` | Renders with a sample `organizationName` (`"Clínica Exemplo"`). Does not send. |
| `POST` | `/communications/send` | `{ payload, filters }` | `{ sent: number, failed: number }` | `@Throttle({ default: { limit: 3, ttl: 60000 } })`. Awaits the batch call. |

- `payload` validated by the discriminated-union DTO — invalid/unknown `type` or
  missing per-type fields → 400 via the existing `ValidationPipe` shape.
- `GET /communications/plans` is **not** added — the frontend reuses the existing
  plans query for the plan filter options.

### 5.2 `send-communication.usecase.ts` flow

1. `resolveRecipients(filters)` → `{ emails, count }`.
2. If `count === 0` → 422 `{ message: 'Nenhuma organização corresponde aos filtros' }`.
3. For each recipient org: `renderCommunication(payload, { organizationName })`
   → build `MailMessage { from: MAIL_FROM, to, subject, html, text }`.
4. `resendMailService.sendBatch(messages)` — single call.
5. Count per-message outcomes → `{ sent, failed }`.
6. `logger.info({ msg: 'communication dispatched', type, filters, recipientCount: count, sent, failed, actorId })`.
7. Return `{ sent, failed }`. Total provider failure (call throws) → 502
   `{ message: 'Falha ao enviar comunicado' }`, logged at `error`.

### 5.3 `ResendMailService`

- Reads `RESEND_API_KEY`, `MAIL_FROM` from `ConfigService`.
- `sendBatch(messages)` → calls Resend `batch.send`. Returns per-message
  `{ ok: boolean }`.
- Only place the `resend` package is imported. Unit tests mock this service.
- Batch size assumed ≤ 100 (scale decision). If `messages.length > 100` the
  service chunks into sequential batches of 100 — cheap safety net, not a
  designed-for path.

### 5.4 Module wiring

- `CommunicationsModule` imports `PrismaModule` (recipient query), `ConfigModule`.
- Registered in `app.module.ts`.
- `ThrottlerModule` already global; per-route `@Throttle` on send.

---

## 6. Frontend — page `/communications`

### 6.1 Routing & nav

- New route under the `AdminLayout` group, guarded by `ProtectedRoute`.
- Additionally gated to `SUPER_ADMIN`: non-super-admins get redirected /
  the nav item is hidden. (Add a role check to `ProtectedRoute` via prop, or a
  small `RequireRole` wrapper — implementation plan decides.)
- Sidebar: new item "Comunicados" in the "Operação" section, custom inline SVG
  icon to match the existing sidebar style.

### 6.2 Page structure

Single page, React Hook Form + Zod, `superRefine` for per-type conditional
validation (existing pattern in the codebase).

- **Template type selector** (`MAINTENANCE` / `INCIDENT` / `ANNOUNCEMENT`) —
  switches the visible field set.
- **Structured fields** per type (section 3).
- **Filters** — `orgStatus` multiselect (default `ACTIVE`), `subscriptionStatus`
  multiselect, `plan` multiselect (options from the existing plans query).
- **Preview button** → `POST /communications/preview` → renders returned `html`
  in a sandboxed `<iframe srcdoc>` + shows "X organizações receberão este
  comunicado".
- **Send button** → confirmation modal ("Enviar para X organizações?
  Esta ação não pode ser desfeita.") → `POST /communications/send` →
  `toast.success` with `sent` / `toast.error` with `failed` or error message
  via `getErrorMessage`.
- Error banner on preview/plans query failure (existing list-page convention).

### 6.3 API client

- New hooks in the React Query style: `usePreviewCommunication` (mutation),
  `useSendCommunication` (mutation). No caching — both are mutations.
- Types added to `src/types/admin.ts`: `CommunicationType`,
  `CommunicationPayload` (discriminated union), `RecipientFilter`,
  `PreviewResponse`, `SendResponse`.

---

## 7. Configuration

| Env var | Purpose | Required |
|---|---|---|
| `RESEND_API_KEY` | Resend API credential | Yes — startup fails if absent (project convention for critical envs) |
| `MAIL_FROM` | Sender identity, e.g. `Pelvi <avisos@soupelvi.com.br>`. Domain must be verified in Resend. | Yes — startup fails if absent |

- Add both to `backend/.env.example` with placeholder values.
- Document in `CLAUDE.md` / `AGENTS.md` env table.
- Production: set in Coolify env for `backoffice-api`.

New dependency: `resend` (backend only). Installed via Bun; `bun.lock` updated.

---

## 8. Testing

### Backend (Jest)

- `resolve-recipients.usecase.spec.ts` — each filter dimension, combinations,
  empty-filter default (`ACTIVE`), duplicate-email collapse, multi-subscription
  org, zero-match result.
- `render-communication.spec.ts` — one snapshot per template type; markdown
  sanitization (script/img/style stripped, allowed tags kept); date formatting
  (pt-BR, São Paulo tz); subject derivation per type; `organizationName`
  interpolation; plain-text alternative present.
- `template-registry` — unknown type rejected; per-type field validation
  (missing required, `endsAt` before `startsAt`, out-of-range lengths).
- `send-communication.usecase.spec.ts` — mocked `ResendMailService`: happy path
  `{ sent, failed }` counts, partial failure, zero-recipient 422, provider throw
  → 502, `logger.info` called with expected shape.
- `communications.controller.spec.ts` — `@Roles(SUPER_ADMIN)` enforced (403 for
  `FINANCE` / `SUPPORT`); throttle metadata present on `send`.

### Frontend

- Form validation per template type (Zod `superRefine`): required fields,
  `endsAt` > `startsAt`, markdown length caps.
- Send button disabled until a preview has been run (forces preview-before-send).
- Confirmation modal shows the recipient count from the last preview.

### Manual / staging

- No staging env exists. Before first real broadcast: verify Resend domain,
  send a `ANNOUNCEMENT` with a filter matching a single internal test org.

---

## 9. Security & safety notes

- `SUPER_ADMIN` only, enforced at controller via `RolesGuard` + re-checked on the
  frontend route.
- Markdown sanitized server-side before rendering — operator input is
  semi-trusted but sanitization prevents accidental broken HTML / injection into
  the email.
- `@Throttle` 3/min on `send` limits blast-radius of a runaway loop or fat-finger.
- Confirmation modal + mandatory preview are the primary human safeguards
  (no undo, no persistence to reference later).
- `MAIL_FROM` domain must have SPF/DKIM configured in Resend or mail lands in
  spam — call out in the implementation plan as a prerequisite.
- No recipient list or email content is persisted — nothing new to protect at
  rest.

---

## 10. Development workflow (per CLAUDE.md)

Before implementation:

1. Create / locate a tracked item on the project board
   (`https://github.com/orgs/brav-lima/projects/1`), move to **In progress**.
2. Branch `feat/<issue>-communications-system` off `main`.
3. PR targets `main`, body `Closes #<n>`, passes `tsc --noEmit` both packages.
4. After merge, move board item to **Done**.

---

## 11. Resolved during brainstorming

- **Provider:** Resend, confirmed. The `ResendMailService` seam keeps the choice
  reversible without touching the domain layer.
- **Template count:** 3 for MVP. Billing dropped (per-org data, not a broadcast
  fit); no 4th type. Adding one later = new entry in the template registry +
  mirrored Zod schema, no structural change.
