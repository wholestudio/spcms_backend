# Security

## Current foundation

| Control       | Implementation                                                                    |
| ------------- | --------------------------------------------------------------------------------- |
| Secrets       | Environment variables only; validated at boot                                     |
| CORS          | Explicit origin list from `CORS_ORIGINS`. Wildcard is rejected in production.     |
| HTTP headers  | Helmet. See CSP note below.                                                       |
| Rate limiting | `express-rate-limit` in-memory store. Health is skipped. Auth routes use tighter limits. |
| Passwords     | `argon2` (argon2id) helpers (`hashPassword` / `verifyPassword` / `needsRehash`)            |
| JWT access    | Short-lived JWT (`JWT_ACCESS_EXPIRES_IN`, default 15m), payload `{ sub, role }`            |
| Refresh       | Opaque token, SHA-256 at rest, rotation + family reuse detection                          |
| Cookies       | `spcms_session` (access) and `spcms_refresh` (path `/api/v1/auth`); Bearer still accepted  |
| Identity      | Prisma `User` (+ seed via `npm run seed:admin`). No in-memory bootstrap login.            |
| RBAC          | `authorize(...roles)` checks `req.user.role` after DB-backed `authenticate`               |
| Validation    | Zod on body / query / params                                                      |
| Errors        | Central handler; production hides unexpected `err.message`                        |
| Logging       | Pino redacts authorization, cookies, passwords, tokens                            |
| Audit         | `AuditLog` writes for auth events (best-effort; failures are logged only)         |

Roles (aligned with Prisma `Role` enum):

`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `CUSTOMER`

Staff roles for CMS (`STAFF_ROLES`): `SUPER_ADMIN`, `ADMIN`, `EDITOR`

## Auth flow (summary)

1. **Register** creates `CUSTOMER` + `PENDING_VERIFICATION` and emails a single-use verification token.
2. **Verify email** activates the account (`ACTIVE`).
3. **Login** ( `/auth/login` or staff-only `/admin/auth/login` ) issues access + refresh cookies after lockout / status checks.
4. **Refresh** rotates the refresh token in-family; presenting a revoked token revokes the whole family (`TOKEN_REUSE_DETECTED`).
5. **Password reset / change** updates `passwordChangedAt`, revokes all refresh tokens, and invalidates older access JWTs on next request.

Anti-enumeration: register (duplicate), resend-verification, and forgot-password always return the same generic success message.

## Helmet / CSP (tune later)

This process is a JSON API. Helmet's default Content-Security-Policy blocks Swagger UI (inline scripts). CSP is therefore **disabled** on the API, along with COEP, so `/api/docs` and browser-based admin/customer apps are not broken by API headers.

The Next.js apps should set their own CSP. If Swagger is exposed in a locked-down production environment, either disable it (`SWAGGER_ENABLED=false`) or add a tight CSP that allows the Swagger UI assets.

Other Helmet defaults (frameguard, nosniff, HSTS in production HTTPS, etc.) remain on.

## CORS origins to plan

Set `CORS_ORIGINS` to a comma-separated list, for example:

```text
http://localhost:3000,http://localhost:3001
```

API listens on **port 4000** locally so it does not collide with the Next.js CMS on port 3000.

Replace with staging and production frontend + CMS origins. Never `*`.

## Rate limiting later

The limiter accepts a `store` option. When more than one API instance is required, pass a Redis store from `express-rate-limit` / `rate-limit-redis`. Do not add Redis until that operational need exists.

## What is not implemented

- Google login, phone OTP, 2FA
- Payment webhooks or card data handling
- File upload antivirus / signed-upload policies
