import { createQueueClient } from "./client";

const globalForQueues = globalThis as unknown as {
  queues: ReturnType<typeof createQueueClient> | undefined;
};

export const queues =
  globalForQueues.queues ??
  createQueueClient({
    database: {
      connectionString: getUrl(),
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueues.queues = queues;
}

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
