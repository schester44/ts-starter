import type { PrismaClient } from "../generated/prisma/client";

export type Environment = "production" | "staging" | "development";

export interface MigrationContext {
  db: PrismaClient;
  /**
   * Resolved environment:
   * - NODE_ENV=development → "development"
   * - NODE_ENV=production + SEMANTIC_ENV=production → "production"
   * - NODE_ENV=production + SEMANTIC_ENV≠production → "staging"
   */
  env: Environment;
}

export interface DataMigration {
  name: string;
  up: (ctx: MigrationContext) => Promise<void>;
}

export function migration(config: DataMigration): DataMigration {
  return config;
}
