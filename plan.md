# Mailtrail — Project Init Plan

Monorepo setup using Yarn 4 workspaces, TanStack Start, Prisma, Turborepo, ESLint, Prettier, and TypeScript. Modeled after `~/work/surefin`.

---

## Directory Structure

```
mailtrail/
├── apps/
│   └── app/                        # TanStack Start app
│       ├── src/
│       │   ├── routes/
│       │   │   ├── __root.tsx          # HTML shell, Tailwind import
│       │   │   ├── index.tsx           # Public landing / login page
│       │   │   └── _authed/
│       │   │       ├── route.tsx       # Auth guard layout (redirects to / if unauthenticated)
│       │   │       └── index.tsx       # Authenticated dashboard
│       │   ├── lib/
│       │   │   ├── auth.ts            # better-auth server config (prisma adapter, org plugin, google oauth)
│       │   │   └── auth-client.ts     # better-auth React client
│       │   ├── router.tsx
│       │   ├── entry-client.tsx
│       │   ├── entry-server.tsx
│       │   └── styles.css
│       ├── app.config.ts
│       ├── components.json            # shadcn config
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── db/                         # Prisma package
│       ├── src/
│       │   ├── prisma/
│       │   │   └── schema.prisma      # better-auth idempotent schema
│       │   └── index.ts               # PrismaClient singleton export
│       ├── prisma.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── turbo.json
├── .env-example
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .prettierignore
├── .yarnrc.yml
├── eslint.config.js
├── package.json
├── Procfile
├── tsconfig.base.json
├── turbo.json
└── vitest.config.ts
```

---

## Step-by-step

### 1. Root Configuration

- **package.json** — `"name": "mailtrail"`, private, `"type": "module"`, workspaces `["apps/*", "packages/*"]`, `packageManager: "yarn@4.6.0"`
  - Scripts: `dev`, `build`, `lint`, `typecheck`, `generate`, `migrate`, `heroku-postbuild`
  - devDependencies: eslint 9, prettier, turbo, typescript-eslint, vitest, @vitest/coverage-v8, @types/node, globals, eslint-config-prettier, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-plugin-unused-imports, @stylistic/eslint-plugin
- **.yarnrc.yml** — `nodeLinker: node-modules`
- **.nvmrc** — `22`
- **tsconfig.base.json** — strict config (same as surefin: strict, noUncheckedIndexedAccess, skipLibCheck, etc.)
- **turbo.json** — tasks: build (dependsOn ^build), dev (cache false, persistent), lint, typecheck, generate, migrate
- **eslint.config.js** — flat config with TS, React hooks, React refresh, Prettier, unused-imports, @stylistic (no custom plugin)
- **.prettierrc** — `{}` (defaults)
- **.prettierignore** — `build`, `coverage`, `node_modules`, `.output`
- **vitest.config.ts** — projects: `["apps/*", "packages/*"]`
- **.gitignore** — node_modules, dist, .output, .turbo, .env*, .DS_Store, *.tsbuildinfo, coverage, .nitro
- **Procfile** — `web: yarn workspace @mailtrail/app start`
- **.env-example**:
  ```
  DATABASE_URL=postgresql://localhost:5432/mailtrail
  BETTER_AUTH_SECRET=<openssl rand -base64 32>
  BETTER_AUTH_URL=http://localhost:3000
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  ```

### 2. `apps/app` — TanStack Start

- **package.json** — `"name": "@mailtrail/app"`, private
  - Dependencies: `@tanstack/react-start`, `@tanstack/react-router`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`, `better-auth`, `@mailtrail/db` (`workspace:*`)
  - DevDependencies: `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vite`, `tw-animate-css`, `tailwindcss`
  - Scripts: `dev`, `build`, `start`, `lint`, `typecheck`
- **tsconfig.json** — extends `../../tsconfig.base.json`, jsx react-jsx, moduleResolution bundler, paths: `@/*` → `./src/*`
- **app.config.ts** — TanStack Start app config with Vite + React plugin + Tailwind
- **components.json** — shadcn config (New York style, `@/components/ui` alias)

#### Auth setup (`src/lib/`)

- **auth.ts** — better-auth server config:
  - `prismaAdapter(db, { provider: "postgresql" })`
  - `organization()` plugin (bare-bones: `allowUserToCreateOrganization: true`)
  - Google social provider (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
  - `emailAndPassword: { enabled: true }`
  - `tanstackStartCookies()` plugin (must be last)
  - Database hook to auto-set `activeOrganizationId` on session creation
- **auth-client.ts** — `createAuthClient` from `better-auth/react` with `organizationClient()` plugin

#### Routes (`src/routes/`)

- **__root.tsx** — root layout: HTML shell, `<head>`, Tailwind CSS import, `<Outlet />`
- **index.tsx** — public page: login form (email/password + Google OAuth button via `authClient.signIn.social({ provider: "google" })`)
- **_authed/route.tsx** — layout route with `beforeLoad` guard: checks session via `authClient.getSession()`, redirects to `/` if unauthenticated
- **_authed/index.tsx** — simple authenticated dashboard ("Welcome, {user.name}") with sign-out button

### 3. `packages/db` — Prisma

- **package.json** — `"name": "@mailtrail/db"`, private, type module
  - Exports: `"."` → `./src/index.ts`
  - Dependencies: `@prisma/client`
  - DevDependencies: `prisma`, `typescript`, `dotenv`
  - Scripts: `generate`, `migrate`, `reset`
- **tsconfig.json** — extends `../../tsconfig.base.json`, moduleResolution bundler
- **turbo.json** — extends root, generate outputs, migrate/reset uncached
- **prisma.config.ts** — loads `.env` from `../../apps/app/.env`, defines schema/migration paths, datasource URL
- **src/index.ts** — PrismaClient singleton (global caching pattern like surefin)

#### Schema (`src/prisma/schema.prisma`)

Idempotent with better-auth's expected fields. Models match what `npx @better-auth/cli generate` produces + organization plugin. All fields use better-auth's expected names with `@map` for snake_case DB columns.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?
  role          String    @default("user")
  banned        Boolean   @default(false)
  banReason     String?   @map("ban_reason")
  banExpires    DateTime? @map("ban_expires") @db.Timestamptz(6)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime? @map("updated_at") @db.Timestamptz(6)

  sessions    Session[]
  accounts    Account[]
  members     Member[]
  invitations Invitation[]

  @@map("users")
}

model Session {
  id                   String   @id
  expiresAt            DateTime @map("expires_at")
  token                String   @unique
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @default(now()) @map("updated_at")
  ipAddress            String?  @map("ip_address")
  userAgent            String?  @map("user_agent")
  userId               String   @map("user_id")
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeOrganizationId String?  @map("active_organization_id")
  impersonatedBy       String?  @map("impersonated_by")

  @@map("sessions")
}

model Account {
  id                    String    @id
  accountId             String    @unique @map("account_id")
  providerId            String    @map("provider_id")
  userId                String    @map("user_id")
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @map("access_token")
  refreshToken          String?   @map("refresh_token")
  idToken               String?   @map("id_token")
  accessTokenExpiresAt  DateTime? @map("access_token_expires_at")
  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at")
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @default(now()) @map("updated_at")

  @@map("accounts")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime  @map("expires_at")
  createdAt  DateTime? @map("created_at")
  updatedAt  DateTime? @map("updated_at")

  @@map("verifications")
}

model Organization {
  id        String    @id
  name      String
  slug      String?
  logo      String?
  metadata  String?
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime? @map("updated_at") @db.Timestamptz(6)

  members     Member[]
  invitations Invitation[]

  @@map("organizations")
}

model Member {
  id             String       @id
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String       @map("user_id")
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String
  createdAt      DateTime     @default(now()) @map("created_at")

  @@map("members")
}

model Invitation {
  id             String       @id
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  email          String
  role           String       @default("member")
  status         String       @default("pending")
  expiresAt      DateTime     @map("expires_at")
  inviterId      String       @map("inviter_id")
  user           User         @relation(fields: [inviterId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("invitations")
}
```

This schema is idempotent with better-auth — running `npx @better-auth/cli generate` will produce no diff. Field names match better-auth's expected property names, `@map` handles DB column naming.

### 4. Install & Initialize

1. `corepack enable && corepack prepare yarn@4.6.0 --activate`
2. `yarn install`
3. Initialize shadcn/ui in `apps/app` (`npx shadcn@latest init`)
4. `git init`
5. Verify: `yarn turbo build`, `yarn turbo lint`, `yarn turbo typecheck`

---

## Decisions

- **Yarn 4** with `nodeLinker: node-modules` (avoids PnP issues)
- **No custom ESLint plugin** — rules directly in root `eslint.config.js`
- **TanStack Start** with Nitro — `app.config.ts`, not `vite.config.ts`
- **PostgreSQL** — `DATABASE_URL` from `.env`
- **Better Auth** — Prisma adapter, organization plugin, Google OAuth, email/password
- **Tailwind v4 + shadcn/ui** — `@tailwindcss/vite`, New York style
- **Heroku** — `Procfile` + `heroku-postbuild`
- **Schema is idempotent** — matches better-auth's expected fields exactly (User, Session, Account, Verification, Organization, Member, Invitation)
- **Node 22**
- **Single package**: `packages/db` only

---

Ready to execute once approved.
