# Contributing to Pelvi Admin

## Development Workflow

### 1. Source of truth: GitHub Issues

Every task is tracked in GitHub Issues on this repo. Check the issue board before starting work. Respect priority order: `critical` → `high` → `medium` → `low`.

### 2. Branch per issue

Create a dedicated branch for each issue, always branching off `main`:

```bash
git checkout main && git pull
git checkout -b <type>/<issue-number>-<short-slug>
```

**Branch naming convention:**

| Type | When to use | Example |
|------|-------------|---------|
| `feat/` | New feature | `feat/12-subscription-invoice-pdf` |
| `fix/` | Bug fix | `fix/7-login-cookie-samesite` |
| `chore/` | Tooling, deps, CI | `chore/3-github-actions-ci` |
| `refactor/` | Code restructure with no behavior change | `refactor/9-organizations-use-cases` |
| `docs/` | Documentation only | `docs/5-readme-setup` |

### 3. Pull Request

Open a PR targeting `main` with the issue reference in the body:

```bash
gh pr create --title "feat: subscription invoice PDF generation" \
  --body "Closes #12"
```

PR checklist before requesting review:
- [ ] `bunx tsc --noEmit` passes in both `frontend/` and `backend/`
- [ ] `bun run lint` passes in both `frontend/` and `backend/`
- [ ] `bun run test` passes in `backend/`
- [ ] `bun run build` succeeds in both
- [ ] New behavior has test coverage in `backend/`

CI runs automatically on every PR — all checks must be green before merge.

### 4. Merge policy

- Squash-merge into `main` (clean history, one commit per PR)
- PR title becomes the commit message — make it descriptive
- Delete the branch after merge

---

## Code Style

### TypeScript

- Strict mode enabled in both `frontend/tsconfig.json` and `backend/tsconfig.json`. Do not disable strict checks.
- Prefer `type` over `interface` for object shapes; use `interface` only when you need declaration merging.
- Avoid `any`. Use `unknown` and narrow with guards when the shape is genuinely unknown.
- No `console.log` left in production code. Use NestJS `Logger` in the backend.

### Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `create-organization.usecase.ts` |
| Classes | `PascalCase` | `CreateOrganizationUseCase` |
| Functions / variables | `camelCase` | `createOrganization` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| React components | `PascalCase` file + export | `OrganizationTable.tsx` |
| Prisma models | `PascalCase` | `Organization`, `AdminUser` |
| DB column names | `snake_case` (Prisma maps automatically) | |
| Env variables | `SCREAMING_SNAKE_CASE` | `DATABASE_ADMIN_URL` |

### Frontend conventions

- All API calls go through TanStack Query hooks in `hooks/` — never call `api.ts` directly from a component.
- Server error messages: extract with `getErrorMessage(err)` from `lib/utils.ts`, surface via `toast.error(...)`.
- No hardcoded backend URLs — Vite proxies `/api/*` → `http://localhost:3001` in dev; keep it that way in prod via reverse proxy.
- Tailwind for styling. No inline `style={{}}` unless computing a dynamic value that Tailwind cannot express.
- Path alias `@/*` → `src/*` — always use it for imports within `src/`.

### Backend conventions

- Every feature module follows the layered pattern: `dto/` → `domain/` → `application/` → `infra/`.
- Use cases are single-responsibility classes with a single public `execute()` method.
- No business logic in controllers — delegate to use cases.
- Validate all inbound data with `class-validator` DTOs and the global `ValidationPipe`.
- Never build SQL or URL strings by concatenation. Use Prisma for DB and the `buildUrl` helper for outbound clinic-api URLs.
- Rate-limit sensitive endpoints (auth, password reset) with `@Throttle()`.

### Formatting

Both `frontend/` and `backend/` use ESLint with TypeScript rules. Run `bun run lint` before pushing. A Prettier config is **not** enforced — use your editor's default TS formatting. The ESLint config is the source of truth for style.

---

## Adding a migration

```bash
cd backend
# Edit prisma/schema.prisma
bun run prisma:migrate:dev --name describe-what-changed
bun run prisma:generate
```

Always commit the generated migration file alongside the schema change.

---

## Secrets

- Never commit `.env.dev` or `.env.prod`.
- `.env.example` must be kept up to date whenever a new variable is added.
- Production secrets live in the deployment platform (Railway, etc.) — never in the repo.
