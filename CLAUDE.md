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

CareFlow Admin is a full-stack SaaS admin dashboard for managing clinic organizations, subscription plans, billing, and metrics. It consists of a React frontend and a NestJS backend in separate subdirectories.

---

## Commands

### Frontend (`frontend/`)

```bash
npm run dev        # Start Vite dev server on port 8081
npm run build      # TypeScript check + production build
npm run lint       # ESLint on src/
npm run preview    # Preview production build
```

### Backend (`backend/`)

```bash
npm run start:dev          # NestJS watch mode (loads .env.dev via dotenvx)
npm run build              # Compile to dist/
npm run lint               # ESLint on src/ and test/
npm run test               # Jest tests

# Prisma
npm run prisma:generate        # Regenerate Prisma client after schema changes
npm run prisma:migrate:dev     # Run dev migrations
npm run prisma:migrate:deploy  # Deploy migrations to production
npm run prisma:seed            # Seed database (ts-node)
npm run prisma:studio          # Open Prisma Studio UI
```

### Environment Setup

Copy `backend/.env.example` to `backend/.env.dev` and populate:
- `DATABASE_ADMIN_URL` — PostgreSQL connection string
- `JWT_ADMIN_SECRET` — JWT signing secret
- `PORT` — Backend port (default 3001)
- `CORS_ORIGIN` — Frontend URL for CORS
- `CLINIC_API_URL` — External CareFlow clinic API base URL
- `CLINIC_INTERNAL_API_KEY` — Shared secret for clinic API requests

---

## Architecture

### Frontend (`frontend/src/`)

React SPA (React Router DOM 7) with:
- **Server state**: TanStack React Query — all API calls use query hooks with caching/refetch
- **Auth state**: `contexts/AdminAuthContext.tsx` — stores user in React state, session validated via `GET /auth/me` on mount; provides `useAdminAuth()`
- **HTTP client**: `lib/api.ts` — Axios instance with `withCredentials: true` (sends httpOnly cookie automatically) and redirects to `/login` on 401
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with CSS variable-based theming; `ui/` primitives are Radix UI wrappers

**Routing**: Protected by `components/auth/ProtectedRoute.tsx`. Layout routes under `/` render `AdminLayout` → `AdminSidebar` + `AdminTopBar` with nested pages.

**Path alias**: `@/*` resolves to `src/*`

**Dev proxy**: Vite proxies `/api/*` → `http://localhost:3001` — no hardcoded backend URL in frontend code.

### Backend (`backend/src/`)

NestJS API on port 3001. Global prefix `/api/admin`. Swagger docs at `/api/admin/docs`.

**Module layout** — each feature follows a layered pattern:
- `dto/` — request/response shapes (class-validator decorators)
- `domain/` — entities and repository interfaces
- `application/` — use cases (single-responsibility classes)
- `infra/` — Prisma repository implementations and external service clients

**Auth**: JWT via Passport (`auth/strategies/`). Guards:
- `JwtAuthGuard` — verifies token, applied globally or per-controller
- `RolesGuard` — checks `@Roles()` decorator against `AdminRole` enum

**Admin roles**: `SUPER_ADMIN`, `FINANCE`, `SUPPORT` — defined in Prisma schema and `types/admin.ts`

**External integration**: `clinic-api/` module calls the CareFlow clinic service using a shared internal API key (`CLINIC_INTERNAL_API_KEY` header). This is used to resolve clinic data without cross-database foreign keys.

### Database (Prisma + PostgreSQL)

Schema at `backend/prisma/schema.prisma`. Core models:
- `AdminUser` — internal admin accounts with `role`
- `Organization` — SaaS customers (status: `ACTIVE | SUSPENDED | CANCELED`)
- `Plan` — subscription tiers with pricing and feature flags
- `Subscription` — links Organization → Plan (status: `TRIAL | ACTIVE | PAST_DUE | CANCELED`)
- `Invoice` — billing records per subscription

After any schema change run `prisma:generate` to update the Prisma client, then `prisma:migrate:dev` to create and apply a migration.

### Path Aliases

Both frontend and backend use `@/*` → `src/*` in their respective `tsconfig.json` files.
