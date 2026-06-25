import { db } from "@__APP_NAME__/db";
// eslint-disable-next-line no-restricted-imports
import { test as baseTest } from "vitest";
import { type PrismaClient } from "@__APP_NAME__/db";
import { describe, expect } from "vitest";
import { resetDatabase } from "./db";
import { createTestEnv, type TestEnv } from "./env";

export type TestContext = {
  db: PrismaClient;
  env: TestEnv;
};

export { describe, expect };

export const test = baseTest.extend<TestContext>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    await resetDatabase(db);
    await use(db);
  },
  // eslint-disable-next-line no-empty-pattern
  env: async ({}, use) => {
    const { env, cleanup } = createTestEnv();
    await use(env);
    cleanup();
  },
});
