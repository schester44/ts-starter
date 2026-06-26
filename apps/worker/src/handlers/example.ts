import type { Job } from "@__APP_NAME__/queues";
import { logger } from "../lib/logger";

/**
 * Example job handler.
 *
 * To add a new handler:
 * 1. Create a file in this directory
 * 2. Export a handler function that receives Job<T> where T matches the queue's schema
 * 3. Register it in src/index.ts with `provider.work(yourQueue, yourHandler)`
 */
export async function handleExample(job: Job<{ message: string }>) {
  logger.info({
    msg: "Processing example job",
    jobId: job.id,
    message: job.data.message,
  });

  // Your job logic here
}
