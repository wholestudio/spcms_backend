# Architecture

This document records architectural decisions for the Studio Patron API.

## Current foundation

The application is a **modular monolith**: one deployable Node.js process, code organized by business domain so a module can later be extracted into its own service if needed.

**Do not introduce microservices in this phase.**

| Area       | Decision                                                                     |
| ---------- | ---------------------------------------------------------------------------- |
| Runtime    | Node.js 20+                                                                  |
| Language   | Plain JavaScript, ECMAScript modules (`"type": "module"`)                    |
| HTTP       | Express.js (`src/app.js` for the app, `src/server.js` for listen + shutdown) |
| Database   | PostgreSQL via Prisma                                                        |
| Docs       | OpenAPI 3 at `/api/docs`                                                     |
| Validation | Zod + `validate()` middleware                                                |
| Auth       | JWT + httpOnly `spcms_session` cookie; `authenticate` / `authorize` / `requirePermission` |
| Logging    | Pino + pino-http, request ID via `x-request-id`                              |
| Tests      | Jest (`tests/unit`, `tests/integration`)                                     |

## Layering

| Layer        | File                   | Responsibility                                                |
| ------------ | ---------------------- | ------------------------------------------------------------- |
| Routes       | `module/routes.js`     | HTTP paths, middleware, controller calls                      |
| Controllers  | `module/controller.js` | Read request, call service, send response. No business logic. |
| Services     | `module/service.js`    | Business rules. No HTTP. No Prisma.                           |
| Repositories | `module/repository.js` | Prisma only. No HTTP.                                         |
| Validators   | `module/validators.js` | Zod schemas for that domain                                   |

Rules:

1. Controllers never import Prisma.
2. Routes never run queries.
3. Domain modules do not import each other.
4. Share cross-cutting code through `src/common`.
5. Share vendors through `src/integrations` only.

## HTTP surface

- Global prefix: `/api/v1`
- Health: `GET /api/v1/health` (public, skipped by rate limiting)
- Auth: `POST /api/v1/admin/auth/login`, `POST /api/v1/admin/auth/logout`, `GET /api/v1/admin/auth/session`
- OpenAPI UI: `/api/docs` (spec JSON: `/api/docs.json`)
- Groups already mounted:
  - `/api/v1/public/*` — unauthenticated customer content
  - `/api/v1/customer/*` — JWT required
  - `/api/v1/admin/*` — JWT + one of the admin roles required (except `/admin/auth/login` and `/admin/auth/logout`)

Domain routers stay inside `src/modules/<domain>/routes.js` and are mounted onto a surface when real endpoints exist.

## Domain modules

Empty architectural folders exist for:

auth, users, products, categories, projects, designIdeas, services, banners, blogs, seo, media, leads, enquiries, quotes, calculator, cart, orders, payments, notifications, analytics, settings.

## Integrations

Replaceable providers (not connected to real vendors):

- Storage — Cloudinary / S3-compatible later. Media binaries never go in PostgreSQL or git.
- Payments — Razorpay later.
- Email — transactional provider later.
- WhatsApp — Business API later.

Register a real implementation with `setStorageProvider` (and equivalents) from composition code. Domain services call `getStorageProvider()`, never a vendor SDK.

## Scaling later

- Stateless HTTP process; JWT is self-contained.
- Prisma connection pooling via `DATABASE_URL`.
- Rate limiting uses an in-memory store today; swap `store` on `createRateLimiter` for Redis when running multiple instances.
- Horizontal scale by running more API processes behind a load balancer.

## Future features

Staff identity in PostgreSQL, register/refresh/password reset, catalog CRUD, CMS, checkout, and live vendor SDKs remain follow-up work.
