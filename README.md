# ts-starter

Opinionated monorepo starter with TanStack Start, Prisma, Better Auth, Tailwind v4 / shadcn, OpenTelemetry, and Turborepo.

## Quick Start

```bash
git clone git@github.com:schester44/ts-starter.git my-app
cd my-app
./setup.sh
```

The setup script will ask for your app name and replace all placeholders, install deps, and generate the Prisma client.

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, Vite 7, Nitro)
- **Auth**: [Better Auth](https://better-auth.com) (email/password, Google OAuth, organizations)
- **Database**: PostgreSQL + [Prisma](https://www.prisma.io)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (New York)
- **Monorepo**: Yarn 4 workspaces + [Turborepo](https://turbo.build)
- **Observability**: [OpenTelemetry](https://opentelemetry.io) (vendor-neutral — works with [otap](https://github.com/schester44/otap), Datadog, Grafana, Honeycomb, etc.)
- **Linting**: ESLint 9 (flat config) + Prettier

## Structure

```
apps/web               → TanStack Start application
apps/worker            → Background job worker (pg-boss)
packages/db            → Prisma schema, client & data migrations
packages/queues        → Type-safe job queue definitions (pg-boss)
packages/storage       → File storage abstraction (S3 / local)
packages/testing       → Shared test utilities, fixtures & factories
packages/observability → OpenTelemetry instrumentation
heroku/                → Heroku deploy scripts (post-build & release)
```

## After Setup

```bash
# Configure environment
cp .env-example apps/web/.env
# Edit apps/web/.env with your values

# Create database & run migrations
createdb <your-app-name>
cd packages/db && npx prisma migrate dev --name init

# Start dev server
yarn dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `yarn dev`       | Start all workspaces in dev mode |
| `yarn build`     | Production build                 |
| `yarn lint`      | Lint all workspaces              |
| `yarn typecheck` | Type-check all workspaces        |
| `yarn generate`  | Generate Prisma client           |
| `yarn migrate`   | Run Prisma migrations            |
| `yarn worker`    | Start the background job worker  |

## Queues

Background jobs are powered by [pg-boss](https://github.com/timgit/pg-boss) — no extra infrastructure required, jobs live in your Postgres database.

**Define a queue** in `packages/queues/src/queues/`:

```ts
import { z } from "zod";
import { queues } from "../queues";

export const exampleQueue = queues.create({
  name: "example",
  schema: z.object({ message: z.string() }),
  sendOptions: { retryLimit: 3, retryDelay: 30, retryBackoff: true },
});
```

**Send a job** from anywhere (e.g. a route handler):

```ts
import { exampleQueue } from "@__APP_NAME__/queues";
await exampleQueue.send({ message: "hello" });
```

**Process jobs** by registering a handler in `apps/worker`:

```ts
await exampleQueue.work(async (job) => {
  console.log(job.data.message);
});
```

## Storage

The `@__APP_NAME__/storage` package provides a unified `StorageClient` interface with two built-in implementations:

- **`makeS3StorageClient`** — for production (S3-compatible)
- **`makeLocalStorageClient`** — for local development (writes to disk)
- **`createStorageClient`** — auto-selects based on environment

```ts
import { createStorageClient } from "@__APP_NAME__/storage";
const storage = createStorageClient();

const { key } = await storage.put({ key: "uploads/photo.jpg", data: buffer, contentType: "image/jpeg" });
const file = await storage.get(key);
```

## Testing

The `@__APP_NAME__/testing` package provides shared test utilities:

- **`test` / `describe` / `expect`** — extended Vitest with automatic database reset and environment fixtures
- **Factories** — `createUser`, `createOrganization`, `createMember`, `createInvitation`
- **Mocks** — job and logger mocks for isolated unit tests

```ts
import { test, expect } from "@__APP_NAME__/testing";

test("example", async ({ db, env }) => {
  // db is a clean PrismaClient, env has test environment helpers
});
```

## Data Migrations

One-off data migrations live in `packages/db/src/data-migrations/migrations/`. They are tracked in a `_data_migrations` table and are idempotent — each migration runs at most once per environment.

## Heroku Deployment

The `heroku/` directory contains deploy scripts:

- **`post-build.sh`** — verifies database connectivity, runs Prisma migrations with retry logic
- **`release.sh`** — seeds the database if empty, runs schema and data migrations

## Using Supabase

This starter works with [Supabase](https://supabase.com) as a drop-in PostgreSQL host. Follow these steps:

### 1. Create a Prisma database user

In the [Supabase SQL Editor](https://supabase.com/dashboard), run:

```sql
-- Create a dedicated Prisma user
create user "prisma" with password 'YOUR_STRONG_PASSWORD' bypassrls createdb;

-- Let changes appear in the Supabase Dashboard
grant "prisma" to "postgres";

-- Grant permissions on the public schema
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

### 2. Configure connection strings

In your Supabase dashboard, go to **Connect** and grab the **Supavisor Session pooler** string (port `5432`). Set both URLs in `apps/web/.env`:

```env
# Pooled connection — used by the app at runtime
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres"

# Direct connection — used by Prisma for migrations
DIRECT_DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

> **Serverless/edge deployments**: Use port `6543` (transaction mode) for `DATABASE_URL` instead of `5432` (session mode).

### 3. Run migrations

```bash
cd packages/db && npx prisma migrate dev --name init
```

That's it — everything else (Better Auth, the app) works unchanged.

For more details, see the [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma).

## Environment Variables

| Variable                      | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                | PostgreSQL connection string (pooled for Supabase)|
| `BETTER_AUTH_SECRET`          | Auth encryption secret (min 32 chars)            |
| `BETTER_AUTH_URL`             | App base URL                                     |
| `GOOGLE_CLIENT_ID`            | Google OAuth client ID                           |
| `GOOGLE_CLIENT_SECRET`        | Google OAuth client secret                       |
| `DIRECT_DATABASE_URL`         | Direct PostgreSQL URL for migrations (Supabase)  |
| `OTEL_ENABLED`                | Enable OpenTelemetry tracing (`true`/`false`)    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint (default: `http://localhost:4318`) |
| `OTEL_SERVICE_NAME`           | Service name                                     |
| `AWS_REGION`                  | AWS region for S3 storage                        |
| `AWS_S3_BUCKET`               | S3 bucket name                                   |
| `LOCAL_STORAGE_PATH`          | Local file storage path (dev only)               |

## Adding shadcn Components

```bash
cd apps/app
npx shadcn@latest add button
```
