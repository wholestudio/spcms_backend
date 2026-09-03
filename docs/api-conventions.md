# API conventions

## Prefix and versioning

All JSON APIs live under `/api/v1`. OpenAPI UI lives at `/api/docs` (outside the versioned prefix so it can cover multiple versions later).

## Surfaces

| Prefix             | Audience                               | Auth                    |
| ------------------ | -------------------------------------- | ----------------------- |
| `/api/v1/public`   | `studiopatron_app` anonymous traffic   | None                    |
| `/api/v1/customer` | `studiopatron_app` signed-in customers | Bearer JWT              |
| `/api/v1/admin`    | `spcms_frontend` staff                 | Bearer JWT + admin role |

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

Production responses never include stack traces, SQL, or secrets.

## Headers

| Header          | Purpose                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| `x-request-id`  | Correlation ID. Generated if the client omits it; echoed on the response. |
| `Authorization` | `Bearer <access-token>` on customer and admin surfaces.                   |

## Validation

Use the shared `validate({ body, query, params })` middleware with Zod schemas. Domain-specific schemas belong in `module/validators.js`. Shared pagination lives in `src/common/validators`.

## Pagination, filtering, sorting

Use `parseListQuery` / `listQuerySchema` for `page`, `limit`, `search`, `sortBy`, `sortOrder`. Domain filters are added per endpoint — do not build a generic query language.

## OpenAPI

Add `@openapi` JSDoc on route files. Swagger is generated from `src/routes/**/*.js` and `src/modules/**/*.js`. Do not add fake business paths just to fill the UI.

## Current vs future

**Current:** health, empty public/customer/admin mounts, documentation of envelopes.

**Future:** real resource paths such as `/api/v1/public/products`, `/api/v1/admin/blogs`.
