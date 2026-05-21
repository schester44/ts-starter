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

## Environment Variables

| Variable                      | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `DATABASE_URL`                | PostgreSQL connection string                     |
| `BETTER_AUTH_SECRET`          | Auth encryption secret (min 32 chars)            |
| `BETTER_AUTH_URL`             | App base URL                                     |
| `GOOGLE_CLIENT_ID`            | Google OAuth client ID                           |
| `GOOGLE_CLIENT_SECRET`        | Google OAuth client secret                       |
| `OTEL_ENABLED`                | Enable OpenTelemetry tracing (`true`/`false`)    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint (default: `http://localhost:4318`) |
| `OTEL_SERVICE_NAME`           | Service name                                     |

## Adding shadcn Components

```bash
cd apps/app
npx shadcn@latest add button
```
