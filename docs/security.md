# Security

## Current foundation

| Control       | Implementation                                                                    |
| ------------- | --------------------------------------------------------------------------------- |
| Secrets       | Environment variables only; validated at boot                                     |
| CORS          | Explicit origin list from `CORS_ORIGINS`. Wildcard is rejected in production.     |
| HTTP headers  | Helmet. See CSP note below.                                                       |
| Rate limiting | `express-rate-limit` in-memory store. Health is skipped.                          |
| Passwords     | `bcryptjs` helpers (`hashPassword` / `verifyPassword`) — no user store yet        |
| JWT           | Sign/verify helpers + `authenticate` middleware. No login endpoint yet.           |
| RBAC          | `authorize(...roles)` and `requirePermission(...)` — not scattered in controllers |
| Validation    | Zod on body / query / params                                                      |
| Errors        | Central handler; production hides unexpected `err.message`                        |
| Logging       | Pino redacts `authorization`, `password`, `token`, `secret`                       |

Admin roles (future assignments, no seed users):

`SUPER_ADMIN`, `CONTENT_MANAGER`, `SALES_MANAGER`, `ORDER_MANAGER`, `ANALYST`

Authorization is intended to cover:

- Route-level (middleware on a router or path)
- Action-level (`requirePermission`)
- Resource-level (helpers such as `hasRole` / `hasPermission` used from services, not ad-hoc `if` in controllers)

## Helmet / CSP (tune later)

This process is a JSON API. Helmet's default Content-Security-Policy blocks Swagger UI (inline scripts). CSP is therefore **disabled** on the API, along with COEP, so `/api/docs` and browser-based admin/customer apps are not broken by API headers.

The Next.js apps should set their own CSP. If Swagger is exposed in a locked-down production environment, either disable it (`SWAGGER_ENABLED=false`) or add a tight CSP that allows the Swagger UI assets.

Other Helmet defaults (frameguard, nosniff, HSTS in production HTTPS, etc.) remain on.

## CORS origins to plan

Set `CORS_ORIGINS` to a comma-separated list, for example:

```text
http://localhost:3000,http://localhost:3001
```

Replace with staging and production frontend + CMS origins. Never `*`.

## Rate limiting later

The limiter accepts a `store` option. When more than one API instance is required, pass a Redis store from `express-rate-limit` / `rate-limit-redis`. Do not add Redis until that operational need exists.

## What is not implemented

- Registration, login, refresh, logout, password reset
- Fake users or seed credentials
- Payment webhooks or card data handling
- File upload antivirus / signed-upload policies

Those belong to later phases, still using this centralized middleware.
