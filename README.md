# Pelvi Admin

Internal SaaS admin dashboard for managing clinic organizations, subscription plans, billing, and metrics — the operator back-office of the `pelvi-ui` clinic product.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router DOM 7 + TanStack Query |
| UI | Tailwind CSS + Radix UI primitives |
| Forms | React Hook Form + Zod |
| Backend | NestJS 11 + Passport (JWT via httpOnly cookie) |
| ORM | Prisma 6 + PostgreSQL |
| Package manager | Bun |
| Language | TypeScript throughout |

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.x
- Node.js ≥ 20 (for tooling compatibility)
- PostgreSQL ≥ 15 (or use Docker — see below)

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env.dev
# Edit .env.dev — set DATABASE_ADMIN_URL, JWT_ADMIN_SECRET, CLINIC_API_URL, CLINIC_INTERNAL_API_KEY
bun install
bun run prisma:generate
bun run prisma:migrate:dev
bun run prisma:seed         # optional — seeds admin users
bun run start:dev           # starts on port 3001
```

### 2. Frontend

```bash
cd frontend
bun install
bun run dev                 # starts on port 8081, proxies /api → localhost:3001
```

Swagger docs: http://localhost:3001/api/admin/docs

### Docker (full stack)

The parent `docker-compose.yml` in `C:/Repos/Careflow/` orchestrates both pelvi-ui and pelvi-admin together with a shared Postgres instance:

```bash
cd C:/Repos/Careflow
cp .env.example .env        # set INTERNAL_API_KEY and other secrets
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Admin web (port 8081) | http://localhost:8081 |
| Admin API + Swagger (port 3001) | http://localhost:3001/api/admin/docs |
| Clinic web (port 8080) | http://localhost:8080 |
| pgAdmin (port 5050) | http://localhost:5050 |

## Project Structure

```
pelvi-admin/
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── components/     # UI components (auth/, ui/ primitives)
│       ├── contexts/       # AdminAuthContext, ToastContext
│       ├── hooks/          # TanStack Query hooks
│       ├── lib/            # api.ts (Axios), utils.ts
│       └── pages/          # Route-level components
├── backend/                # NestJS API (port 3001)
│   └── src/
│       ├── auth/           # JWT strategy, guards
│       ├── clinic-api/     # HTTP client to pelvi-ui internal API
│       ├── organizations/  # Core feature module
│       ├── plans/
│       ├── subscriptions/
│       └── invoices/
└── .github/
    └── workflows/
        └── ci.yml          # Lint + build + test on every PR
```

## Integration with pelvi-ui

`pelvi-admin` calls `pelvi-ui` over HTTP using a shared `INTERNAL_API_KEY`. The two products do **not** share a database. Set `CLINIC_API_URL` (the pelvi-ui backend base URL, e.g. `http://localhost:3000`) and `CLINIC_INTERNAL_API_KEY` (must match `INTERNAL_API_KEY` in pelvi-ui).

## Commands Reference

### Frontend

```bash
bun run dev        # Dev server on port 8081
bun run build      # tsc -b + vite build
bun run lint       # ESLint
bun run preview    # Preview production build
```

### Backend

```bash
bun run start:dev              # NestJS watch mode
bun run build                  # nest build
bun run lint                   # ESLint
bun run test                   # Jest tests
bun run prisma:generate        # Regenerate Prisma client
bun run prisma:migrate:dev     # Create + apply dev migration
bun run prisma:studio          # Open Prisma Studio UI
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env.dev` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_ADMIN_URL` | PostgreSQL connection string |
| `JWT_ADMIN_SECRET` | JWT signing secret (keep secret) |
| `PORT` | Backend port (default 3001) |
| `CORS_ORIGIN` | Frontend URL — required in production |
| `CLINIC_API_URL` | Base URL of pelvi-ui backend (no path suffix) |
| `CLINIC_INTERNAL_API_KEY` | Shared secret matching pelvi-ui `INTERNAL_API_KEY` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, PR process, and coding conventions.
