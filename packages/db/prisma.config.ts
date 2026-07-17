import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { defineConfig } from "prisma/config";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IS_TEST = process.env.NODE_ENV === "test";

const envPaths = [resolve(__dirname, "../../apps/web/.env")];

if (IS_TEST) {
  envPaths.unshift(resolve(__dirname, "../../apps/web/.env.test"));
}

dotenv.config({ path: envPaths });

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set!");
  console.error("Tried loading from:");
  envPaths.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

export default defineConfig({
  schema: "./src/prisma/schema.prisma",
  migrations: {
    path: "./src/prisma/migrations",
    seed: "npx tsx ./src/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
