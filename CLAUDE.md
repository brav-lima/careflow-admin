# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Workflow

All development MUST follow this process — no exceptions:

### 1. Source of truth: GitHub Projects
- Every task comes from the project board at `https://github.com/orgs/brav-lima/projects/1`
- Before starting any implementation, check the board for items in **Ready** status
- Respect the priority order: `critical` → `high` → `medium` → `low`
- Never implement something not tracked in the board

### 2. Branch per issue
- Create a dedicated branch for each issue before writing any code
- Branch naming convention: `<type>/<issue-number>-<short-slug>`
  - Examples: `fix/1-rate-limiting`, `feat/9-refresh-token`, `chore/14-db-indexes`
- Always branch off `main`:
  ```bash
  git checkout main && git pull && git checkout -b fix/1-rate-limiting
  ```

### 3. Pull Request linked to the issue
- Open a PR targeting `main` with the issue number in the body using `Closes #<n>`
- PR title should match the issue title (without the emoji prefix)
- PR must pass TypeScript check (`tsc --noEmit`) before being considered ready
- Use `gh pr create` and include the issue reference:
  ```bash
  gh pr create --title "..." --body "Closes #<n>"
  ```

### 4. Update the board after merge
- After the PR is merged, move the corresponding project item to **Done**
- The `Closes #<n>` keyword in the PR body auto-closes the issue on merge; update the board status manually if needed:
  ```bash
  gh project item-edit --id <PVTI_...> --project-id PVT_kwDODyXYas4BUbPy \
    --field-id PVTSSF_lADODyXYas4BUbPyzhBjbI4 --single-select-option-id 98236657
  ```

### Project field reference
| Field | ID |
|-------|----|
| Project ID | `PVT_kwDODyXYas4BUbPy` |
| Status field | `PVTSSF_lADODyXYas4BUbPyzhBjbI4` |
| Status → Done | `98236657` |
| Status → In progress | `47fc9ee4` |
| Status → Ready | `61e4505c` |
| Status → Backlog | `f75ad846` |

---

## Overview

CareFlow Admin is a full-stack SaaS admin dashboard for managing clinic organizations, subscription plans, billing, and metrics — the **operator back-office** of the `careflow-ui` clinic product. It consists of a React frontend (`frontend/`) and a NestJS backend (`backend/`) in separate subdirectories.

**Package manager**: **Bun** (`bun.lock` is the lockfile of record in both `backend/` and `frontend/`). Do not commit `package-lock.json`.

See the parent `C:/Repos/Careflow/CLAUDE.md` for how this project talks to `careflow-ui` (shared `INTERNAL_API_KEY`, no cross-DB FKs — integration is HTTP-only via the `clinic-api/` module).

---

## Commands

### Frontend (`frontend/`)

```bash
bun run dev        # Start Vite dev server on port 8081
bun run build      # tsc -b + vite build
bun run lint       # ESLint on src/
bun run preview    # Preview production build
```

### Backend (`backend/`)

```bash
bun run start:dev          # NestJS watch mode (loads .env.dev via dotenvx)
bun run build              # nest build → dist/
bun run lint               # ESLint on src/ and test/
bun run test               # Jest tests

# Prisma
bun run prisma:generate        # Regenerate Prisma client after schema changes
bun run prisma:migrate:dev     # Run dev migrations
bun run prisma:migrate:deploy  # Deploy migrations to production
bun run prisma:seed            # Seed database (ts-node)
bun run prisma:studio          # Open Prisma Studio UI
```

### Environment Setup

Copy `backend/.env.example` to `backend/.env.dev` and populate:
- `DATABASE_ADMIN_URL` — PostgreSQL connection string
- `JWT_ADMIN_SECRET` — JWT signing secret
- `PORT` — Backend port (default 3001)
- `CORS_ORIGIN` — Frontend URL for CORS (required in production)
- `CLINIC_API_URL` — Base URL of the careflow-ui clinic API (e.g. `http://localhost:3000`). The admin appends `/api/internal/*` — do **not** include the path prefix in this value.
- `CLINIC_INTERNAL_API_KEY` — Shared secret for clinic API requests. Must match `INTERNAL_API_KEY` on the clinic side.

### Docker

Both frontend and backend have a `Dockerfile`. The backend uses `docker-entrypoint.sh`, which runs `prisma migrate deploy` + seed on startup (idempotent; set `RUN_SEED=false` to skip seeding). Both containers install via Bun. End-to-end orchestration with the clinic product lives in the parent `docker-compose.yml`.

---

## Architecture

### Frontend (`frontend/src/`)

React SPA (React Router DOM 7) with:
- **Server state**: TanStack React Query — all API calls use query hooks with caching/refetch
- **Auth state**: `contexts/AdminAuthContext.tsx` — stores user in React state, session validated via `GET /auth/me` on mount; provides `useAdminAuth()`
- **HTTP client**: `lib/api.ts` — Axios instance with `withCredentials: true` (sends httpOnly `admin_token` cookie automatically) and redirects to `/login` on 401. No token stored in JS.
- **Toast**: `contexts/ToastContext.tsx` — `useToast()` with `toast.success/error`; use `getErrorMessage(err)` from `lib/utils.ts` to extract server messages
- **Forms**: React Hook Form + Zod validation (including `superRefine` for conditional validation in multi-mode forms)
- **Styling**: Tailwind CSS with CSS variable-based theming; `ui/` primitives are Radix UI wrappers

**Routing**: Protected by `components/auth/ProtectedRoute.tsx`. Layout routes under `/` render `AdminLayout` → `AdminSidebar` + `AdminTopBar` with nested pages (Dashboard, Organizations, OrganizationDetail, Plans, Subscriptions, Invoices).

**Path alias**: `@/*` resolves to `src/*`

**Dev proxy**: Vite proxies `/api/*` → `http://localhost:3001` — no hardcoded backend URL in frontend code.

**Formatters** (`lib/utils.ts`): `formatCurrency`, `formatDate`, `formatCNPJ`, `formatCPF`, `getErrorMessage`, `cn` (tailwind-merge).

### Backend (`backend/src/`)

NestJS 11 API on port 3001. Global prefix `/api/admin`. Swagger docs at `/api/admin/docs`.

**Top-level middleware** (in `main.ts`):
- `helmet()` — security headers
- `cookie-parser` — required to read the `admin_token` httpOnly cookie
- `ValidationPipe` global (whitelist + transform)
- CORS with `credentials: true` (to accept the cookie); `CORS_ORIGIN` must be set to a production domain in prod or startup fails

**Module layout** — each feature follows a layered pattern:
- `dto/` — request/response shapes (class-validator decorators)
- `domain/` — entities and repository interfaces
- `application/` — use cases (single-responsibility classes)
- `infra/` — Prisma repository implementations and external service clients

**Rate limiting**: `@nestjs/throttler` applied globally in `AppModule` with a default of 100 req/min. Endpoints that do auth-heavy work (password reset, login) are candidates for a stricter per-route `@Throttle()` — see the open tracking issues (e.g. reset-password rate limit).

**Auth**: JWT via Passport (`auth/strategies/jwt.strategy.ts`) reading the token from the httpOnly cookie `admin_token`. Guards:
- `JwtAuthGuard` — verifies token (applied per-controller via `@UseGuards`)
- `RolesGuard` — checks `@Roles()` decorator against `AdminRole` enum

Login issues the cookie server-side; logout clears it.

**Admin roles**: `SUPER_ADMIN`, `FINANCE`, `SUPPORT` — defined in Prisma schema and `types/admin.ts`.

**External integration (`clinic-api/`)**: the `ClinicApiService` is the single seam that talks to the careflow-ui clinic backend over HTTP using the shared `CLINIC_INTERNAL_API_KEY` header. It:
- Appends `/api/internal/*` to `CLINIC_API_URL` — the clinic product sets a `/api` global prefix, so do **not** call `/internal/*` directly.
- Builds outbound URLs via a `buildUrl` tagged-template helper that `encodeURIComponent`-s every dynamic segment and asserts the final `URL.origin` matches the configured base — this blocks SSRF / path-traversal when ids come from HTTP params.
- Supported operations: clinic create/list, access update, **person upsert**, **link person to clinic (ADMIN/PROFESSIONAL/RECEPTIONIST)**, **list/update/reset-password clinic users**.

**Organizations module**: houses the bulk of the cross-system orchestration. Use cases in `organizations/application/`:
- `create-organization.usecase.ts` — legacy flow that links an existing clinic by `clinicExternalId`
- `create-organization-with-owner.usecase.ts` — the standard flow (see sequence diagram in parent repo `docs/sequence.mermaid`): creates Clinic → upserts Person responsável by CPF → links as ADMIN → persists Organization locally. Idempotent: reusing CPF returns the existing Person with `provisionalPassword: null`.
- `provisional-password.ts` — generates provisional passwords with `crypto.randomInt` (rejection sampling — do NOT use `randomBytes % alphabet.length`, that's biased).
- `reset-clinic-user-password.usecase.ts` — generates a new provisional password and invalidates the previous one via the clinic-api.
- `resolve-clinic-id.ts` — helper that converts admin `organizationId` → `clinicExternalId` before any clinic-api call (since the two DBs share only that link).
- `list-organizations.usecase.ts`, `update-status.usecase.ts` — listing + status transitions.

### Database (Prisma + PostgreSQL)

Schema at `backend/prisma/schema.prisma`. Core models (all IDs are UUIDs):
- `AdminUser` — internal admin accounts with `role`
- `Organization` — SaaS customers. Linked to the clinic product via `clinicExternalId`. Status: `ACTIVE | SUSPENDED | CANCELED`
- `Plan` — subscription tiers with pricing and feature flags
- `Subscription` — links Organization → Plan (status: `TRIAL | ACTIVE | PAST_DUE | CANCELED`)
- `Invoice` — billing records per subscription

The admin DB knows nothing about Persons, OrganizationUsers, Patients, or Appointments — those live in the clinic product and are reached only via `clinic-api/`.

After any schema change run `bun run prisma:generate` to update the Prisma client, then `bun run prisma:migrate:dev` to create and apply a migration.

### Path Aliases

Both frontend and backend use `@/*` → `src/*` in their respective `tsconfig.json` files.
