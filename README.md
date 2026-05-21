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
apps/app               → TanStack Start application
packages/db            → Prisma schema & client
packages/observability → OpenTelemetry instrumentation
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

## Adding shadcn Components

```bash
cd apps/app
npx shadcn@latest add button
```
