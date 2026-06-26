import type PgBoss from "pg-boss";
import { logger } from "../lib/logger";

/**
 * Example job handler.
 *
 * To add a new handler:
 * 1. Create a file in this directory
 * 2. Export a handler function that matches the queue's schema
 * 3. Register it in src/index.ts with `yourQueue.work(yourHandler)`
 */
export async function handleExample(
  job: PgBoss.JobWithMetadata<{ message: string }>,
) {
  logger.info({
    msg: "Processing example job",
    jobId: job.id,
    message: job.data.message,
  });

  // Your job logic here
}
