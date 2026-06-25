import { z } from "zod";
import type PgBoss from "pg-boss";
import type { Logger } from "@__APP_NAME__/observe";

export interface QueueDefinition<T extends z.ZodType> {
  name: string;
  schema: T;
  schedule: (options: { cron: string }) => Promise<void>;
  send: (
    data: z.infer<T>,
    options?: PgBoss.SendOptions & { logger?: Logger },
  ) => Promise<string | null>;
  work: (
    handler: (job: PgBoss.JobWithMetadata<z.infer<T>>) => Promise<void>,
    options?: PgBoss.WorkOptions,
  ) => Promise<string>;
}
