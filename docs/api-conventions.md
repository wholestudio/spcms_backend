# API conventions

## Prefix and versioning

All JSON APIs live under `/api/v1`. OpenAPI UI lives at `/api/docs`. The spec JSON lives at `/api/docs.json` (OpenAPI 1.1.0).

## Surfaces

| Prefix             | Audience                               | Auth                    |
| ------------------ | -------------------------------------- | ----------------------- |
| `/api/v1/auth`     | Customers and staff auth flows         | Mixed (see table below) |
| `/api/v1/public`   | `studiopatron_app` anonymous traffic   | None                              |
| `/api/v1/customer` | `studiopatron_app` signed-in customers | Bearer JWT or session cookie      |
| `/api/v1/admin`    | `spcms_frontend` staff                 | Cookie / Bearer JWT + staff role  |
| `/api/v1/media`    | Authenticated media upload             | Cookie / Bearer JWT               |

## Auth endpoints

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| `POST` | `/api/v1/auth/register` | None | Customer signup |
| `POST` | `/api/v1/auth/verify-email` | None | Confirm email token |
| `POST` | `/api/v1/auth/resend-verification` | None | Resend verify email |
| `POST` | `/api/v1/auth/login` | None | Customer or staff login |
| `POST` | `/api/v1/admin/auth/login` | None | Staff-only login (`STAFF_ROLES`) |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate tokens |
| `POST` | `/api/v1/auth/logout` | Refresh cookie (optional) | Revoke current family |
| `POST` | `/api/v1/auth/logout-all` | Access | Revoke all sessions |
| `POST` | `/api/v1/auth/forgot-password` | None | Request reset email |
| `POST` | `/api/v1/auth/reset-password` | None | Complete reset |
| `POST` | `/api/v1/auth/change-password` | Access | Change password |
| `GET`  | `/api/v1/auth/me` | Access | Current user |
| `GET`  | `/api/v1/health` | None | Liveness |

Cookies:

- `spcms_session` — access JWT, path `/`
- `spcms_refresh` — opaque refresh token, path `/api/v1/auth` (never returned in JSON)

## Success envelope

```json
{
  "success": true,
  "data": {},
  "message": "API is running",
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-08-31T00:00:00.000Z"
  }
}
```

List endpoints should attach `meta.pagination`:

```json
{
  "page": 1,
  "limit": 20,
  "offset": 0,
  "total": 0,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

Use `sendSuccess()` from `src/common/responses`. Controllers must not invent a parallel shape.

## Error envelope

```json
{
  "success": false,
  "message": "Route GET /api/v1/missing not found",
  "error": {
    "code": "NOT_FOUND",
    "details": [{ "field": "body.email", "message": "Required" }]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-08-31T00:00:00.000Z"
  }
}
```

Auth-specific codes include `EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`, `INVALID_TOKEN`.

Production responses never include stack traces, SQL, or secrets.

## Headers

| Header          | Purpose                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `x-request-id`  | Correlation ID. Generated if the client omits it; echoed on the response. |
| `Authorization` | `Bearer <access-token>` (optional if the session cookie is present). |
| `Cookie`        | `spcms_session` and/or `spcms_refresh`. |

## Validation

Use the shared `validate({ body, query, params })` middleware with Zod schemas. Domain-specific schemas belong in `module/validators.js`. Shared pagination lives in `src/common/validators`.

## Pagination, filtering, sorting

Use `parseListQuery` / `listQuerySchema` for `page`, `limit`, `search`, `sortBy`, `sortOrder`. Domain filters are added per endpoint — do not build a generic query language.

## OpenAPI

Add `@openapi` JSDoc on route files. Swagger is generated from `src/routes/**/*.js` and `src/modules/**/*.js`. Do not add fake business paths just to fill the UI.

## Integration tests (auth)

Requires Docker Postgres with migrations applied:

```bash
docker compose up -d postgres
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run seed:admin          # optional staff user
npm test -- tests/integration/auth.test.js
```

Set `RUN_AUTH_INTEGRATION=1` if you want the suite to fail hard when the database is unreachable (default skips with a warning when Prisma cannot connect).
