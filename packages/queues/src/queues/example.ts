import { z } from "zod";
import { queues } from "../queues";

/**
 * Example queue definition.
 *
 * To add a new queue:
 * 1. Create a file in this directory with your queue schema and definition
 * 2. Export it from ../index.ts
 * 3. In apps/worker, register a handler with `yourQueue.work(handler)`
 * 4. In apps/web (or anywhere), send jobs with `yourQueue.send(data)`
 */
export const exampleQueue = queues.create({
  name: "example",
  schema: z.object({
    message: z.string(),
  }),
  sendOptions: {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  },
});
