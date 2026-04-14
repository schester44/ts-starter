import { PrismaClient } from "./generated/prisma/client";

const g = globalThis as unknown as {
  prisma: PrismaClient;
};

export const db =
  g.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  g.prisma = db;
}

export { PrismaClient } from "./generated/prisma/client";
export * from "./generated/prisma/client";
