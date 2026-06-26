import { PgBossProvider } from "./providers/pgboss";
import type { QueueProvider } from "./types";

const globalForQueues = globalThis as unknown as {
  queueProvider: QueueProvider | undefined;
};

export const queueProvider: QueueProvider =
  globalForQueues.queueProvider ??
  new PgBossProvider({
    database: {
      connectionString: getUrl(),
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueues.queueProvider = queueProvider;
}

/**
 * @deprecated Use `queueProvider` instead. This alias exists for backward compatibility.
 */
export const queues = queueProvider;

function getUrl() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const isSecureDb = !DATABASE_URL.includes("localhost");

  const url = new URL(DATABASE_URL);

  if (isSecureDb) {
    url.searchParams.set("sslmode", "no-verify");
  }

  return url.toString();
}
