# Database

## Current foundation

- Engine: PostgreSQL 16 (Docker Compose service `postgres`)
- ORM: Prisma (`src/database/prisma.js`)
- Schema file: `prisma/schema.prisma` — generator + datasource only
- No business models, seed data, or sample tables
- The HTTP process **never** runs `migrate` or `db push` on startup

Connect on boot with `prisma.$connect()`. Disconnect during graceful shutdown.

## Commands

Development:

```bash
npx prisma migrate dev
```

Production release (not on every `node src/server.js`):

```bash
npx prisma migrate deploy
```

Always `npx prisma generate` after schema or client version changes.

## Future schema conventions

Apply these when the business schema is designed (separate phase):

| Concern      | Convention                                               |
| ------------ | -------------------------------------------------------- |
| Primary keys | UUID: `String @id @default(uuid()) @db.Uuid`             |
| Timestamps   | `createdAt` / `updatedAt` as `@db.Timestamptz(3)` (UTC)  |
| Soft delete  | `deletedAt DateTime? @db.Timestamptz(3)` where required  |
| Audit        | `createdBy` / `updatedBy` UUID where required            |
| Money        | `Decimal` — never `Float` / `Float` columns              |
| Relations    | Real foreign keys, unique constraints, and indexes       |
| Media        | Metadata and object keys only; no binaries in PostgreSQL |

## Media storage

Images (200 now, thousands later) live on an object store + CDN. PostgreSQL holds alt text, order, thumbnail keys, and entity relations. See the `media` module comments and `src/integrations/storage`.

## Future domains

Identity, catalog, projects, design ideas, services, content, SEO, media, leads, enquiries, quotes, calculator, cart, orders, payments, notifications, analytics, and settings will be modelled after API contracts are approved.
