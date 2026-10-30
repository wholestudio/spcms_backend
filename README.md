# Studio Patron API

Production-oriented backend foundation for **Studio Patron** — a long-term interior design, interior services, CMS, and e-commerce platform.

This repository is a **modular monolith** on Node.js and Express. Domain folders are in place so modules can later be extracted if the platform grows large enough. Business features, sample data, and vendor integrations are intentionally **not** implemented yet.

The API serves:

- `studiopatron_app` — customer-facing Next.js application
- `spcms_frontend` — CMS + admin Next.js application

## Stack

| Area            | Choice                                     |
| --------------- | ------------------------------------------ |
| Runtime         | Node.js 20+ (22 recommended; see `.nvmrc`) |
| Language        | JavaScript (ESM, `"type": "module"`)       |
| Framework       | Express.js                                 |
| Database        | PostgreSQL                                 |
| ORM             | Prisma                                     |
| API docs        | OpenAPI / Swagger (`/api/docs`)            |
| Validation      | Zod                                        |
| Auth foundation | JWT + centralized RBAC middleware          |
| Tests           | Jest                                       |
| Quality         | ESLint, Prettier                           |
| Containers      | Docker, Docker Compose                     |

## Architecture

Controllers stay thin. Services own business logic. Repositories own Prisma access. Domain modules do not depend on each other. Share only through `common/` and `integrations/`.

See [docs/architecture.md](docs/architecture.md).

### Folder structure

```text
spcms_backend/
├── src/
│   ├── server.js                 # process startup + graceful shutdown
│   ├── app.js                    # Express application (no listen)
│   ├── config/                   # env, app config, Swagger
│   ├── database/                 # Prisma client
│   ├── common/                   # errors, middleware, responses, pagination
│   ├── routes/                   # /public /customer /admin mounts
│   ├── modules/                  # domain boundaries (empty implementations)
│   └── integrations/             # replaceable providers (storage, payments, email, WhatsApp)
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
├── docs/
├── Dockerfile
├── docker-compose.yml
├── eslint.config.js
├── package.json
└── README.md
```

## Current foundation vs future features

**Current foundation**

- Express app with `/api/v1` prefix
- `GET /api/v1/health`
- Auth: `/api/v1/auth/*` (register, login, refresh, password flows) and staff `POST /api/v1/admin/auth/login`
- httpOnly `spcms_session` cookie (Bearer JWT also accepted)
- Public / customer / admin route mounts
- Swagger UI at `/api/docs` (OpenAPI 1.1.0) and spec at `/api/docs.json`
- Env validation, CORS, Helmet, rate limiting, structured logging
- JWT verify middleware and RBAC helpers
- Prisma client (no business schema)
- Pagination, list-query, and Zod validation helpers
- Provider stubs for storage, payments, email, WhatsApp
- Jest, ESLint, Prettier, Docker Compose PostgreSQL

**Future features (not in this repo yet)**

- Business Prisma schema and migrations
- Auth flows, users, catalog, CMS, commerce, payments, quotes, calculator, leads
- Real Cloudinary/S3, Razorpay, email, and WhatsApp providers
- Redis-backed rate limiting

## Prerequisites

- Node.js 20 or later (22 recommended)
- npm
- Docker (for local PostgreSQL)

## Installation

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npx prisma generate
```

## Environment variables

| Variable               | Required                   | Description                            |
| ---------------------- | -------------------------- | -------------------------------------- |
| `NODE_ENV`             | no (default `development`) | `development`, `production`, or `test` |
| `PORT`                 | no (default `4000`)        | HTTP port                              |
| `HOST`                 | no (default `0.0.0.0`)     | Bind address                           |
| `LOG_LEVEL`            | no (default `info`)        | Pino log level                         |
| `API_BASE_URL`         | no                         | Public base URL used in OpenAPI        |
| `DATABASE_URL`         | **yes**                    | PostgreSQL connection string           |
| `JWT_SECRET`           | **yes** (min 32 chars in production) | Access-token signing secret     |
| `JWT_ACCESS_EXPIRES_IN`| no (default `15m`)         | Access-token / session cookie lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | no (default `30`)        | Refresh token lifetime (days)          |
| `MAX_FAILED_LOGINS`    | no (default `5`)           | Lockout threshold                      |
| `LOCKOUT_MINUTES`      | no (default `15`)          | Account lockout duration               |
| `EMAIL_VERIFY_TTL_HOURS` | no (default `24`)        | Email verification token TTL           |
| `PASSWORD_RESET_TTL_MINUTES` | no (default `60`)    | Password reset token TTL               |
| `FRONTEND_URL`         | no (default `http://localhost:3000`) | App URL for auth links      |
| `COOKIE_DOMAIN`        | no                         | Optional cookie domain                 |
| `COOKIE_SAME_SITE`     | no (default `lax`)         | `lax`, `strict`, or `none`             |
| `COOKIE_SECURE`        | no (default true in production) | Secure cookie flag                |
| `BOOTSTRAP_ADMIN_EMAIL` | no                        | Local CMS staff email                  |
| `BOOTSTRAP_ADMIN_PASSWORD` | no (required if email set) | Local CMS staff password (min 8)   |
| `BOOTSTRAP_ADMIN_NAME` | no                         | Display name for the bootstrap admin   |
| `CORS_ORIGINS`         | production: **yes**        | Comma-separated frontend origins       |
| `SWAGGER_ENABLED`      | no                         | Defaults on in non-production          |
| `RATE_LIMIT_WINDOW_MS` | no                         | Rate-limit window                      |
| `RATE_LIMIT_MAX`       | no                         | Max requests per window                |

The process **exits with a clear configuration error** if required variables are missing or invalid. Never commit `.env` or real secrets.

Suggested CORS origins:

- Local frontend (`studiopatron_app`)
- Local CMS (`spcms_frontend`)
- Staging frontend / CMS
- Production frontend / CMS

Do **not** use `origin: *` in production.

## Database setup

PostgreSQL is provided by Docker Compose. The application **does not** create or sync tables on startup. In development, if Postgres is down the API still starts; auth routes that need the database will fail until it is available.

```bash
docker compose up -d postgres
npx prisma generate
```

When models exist, apply schema changes only through Prisma migrations.

## Prisma commands

```bash
npx prisma generate
npx prisma validate
npx prisma migrate dev      # development migrations
npx prisma migrate deploy   # production deployment
npx prisma studio
```

npm aliases: `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run prisma:migrate:deploy`, `npm run prisma:validate`.

## Development commands

```bash
npm run dev          # node --watch
npm start            # node src/server.js
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

- Health: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- OpenAPI UI: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- OpenAPI JSON: [http://localhost:4000/api/docs.json](http://localhost:4000/api/docs.json)

Local CMS login (from `.env.example`):

- `POST /api/v1/admin/auth/login` with `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`
- Session cookie: `spcms_session`

## Test commands

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Build / start commands

There is no compile step. Production start:

```bash
npm start
```

Run `npx prisma migrate deploy` as a **release step**, not inside `src/server.js`.

## Swagger documentation

Enabled when `SWAGGER_ENABLED=true` (default outside production). UI is served at `/api/docs`. Machine-readable spec is at `/api/docs.json` (OpenAPI **1.1.0**). JSDoc `@openapi` comments on route files are picked up automatically as endpoints are added.

## Docker commands

PostgreSQL only (typical local development):

```bash
docker compose up -d postgres
```

API + PostgreSQL:

```bash
docker compose --profile full up --build
```

Stop:

```bash
docker compose down
```

## API conventions (foundation)

- Prefix and version: `/api/v1`
- Groups: `/api/v1/public/*`, `/api/v1/customer/*`, `/api/v1/admin/*`
- Success and error envelopes are standardized (`src/common/responses`)
- Correlation ID header: `x-request-id`
- Authenticated routes accept `Authorization: Bearer <jwt>` **or** the `spcms_session` httpOnly cookie
- Roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `CUSTOMER` (staff: `SUPER_ADMIN`, `ADMIN`, `EDITOR`)

Details: [docs/api-conventions.md](docs/api-conventions.md), [docs/database.md](docs/database.md), [docs/security.md](docs/security.md).

## TODOs (next phase)

- Design and migrate the business Prisma schema
- Implement domain endpoints and authorization per route group
- Connect storage, payment, email, and WhatsApp providers
- Add a customer identity model distinct from admin roles
- Configure production secrets, CORS origins, and Swagger exposure
