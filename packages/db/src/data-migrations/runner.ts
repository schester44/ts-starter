import { config } from "dotenv";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL) {
  config({ path: resolve(import.meta.dirname, "../../../../apps/web/.env") });
}

import { PrismaClient } from "../generated/prisma/client";
import type { DataMigration, Environment } from "./types";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv !== "production") {
    return "development";
  }

  return process.env.SEMANTIC_ENV === "production" ? "production" : "staging";
}

async function ensureMigrationTable(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _data_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(db: PrismaClient): Promise<Set<string>> {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM _data_migrations ORDER BY name`,
  );

  return new Set(rows.map((r) => r.name));
}

async function recordMigration(db: PrismaClient, name: string): Promise<void> {
  await db.$executeRawUnsafe(
    `INSERT INTO _data_migrations (name) VALUES ($1)`,
    name,
  );
}

async function discoverMigrations(): Promise<DataMigration[]> {
  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = await readdir(migrationsDir);

  const migrationFiles = files
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .sort();

  const migrations: DataMigration[] = [];

  for (const file of migrationFiles) {
    const mod = (await import(join(migrationsDir, file))) as {
      default: DataMigration;
    };
    migrations.push(mod.default);
  }

  return migrations;
}

async function run(): Promise<void> {
  const env = getEnvironment();
  console.log(`[data-migrations] Environment: ${env}`);

  const db = new PrismaClient();

  try {
    await ensureMigrationTable(db);
    const executed = await getExecutedMigrations(db);
    const migrations = await discoverMigrations();

    const pending = migrations.filter((m) => !executed.has(m.name));

    if (pending.length === 0) {
      console.log("[data-migrations] No pending migrations.");

      return;
    }

    console.log(
      `[data-migrations] Running ${pending.length} pending migration(s)...`,
    );

    for (const migration of pending) {
      console.log(`[data-migrations] Running: ${migration.name}`);
      await migration.up({ db, env });
      await recordMigration(db, migration.name);
      console.log(`[data-migrations] Completed: ${migration.name}`);
    }

    console.log("[data-migrations] All migrations complete.");
  } finally {
    await db.$disconnect();
  }
}

run().catch((err) => {
  console.error("[data-migrations] Fatal error:", err);
  process.exit(1);
});
