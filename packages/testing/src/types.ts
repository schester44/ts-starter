import { type PrismaClient } from "@__APP_NAME__/db";

export type GlobalTestContext = {
  db: PrismaClient;
};
