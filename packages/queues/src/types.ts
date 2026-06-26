import { z } from "zod";
import type { Logger } from "@__APP_NAME__/observe";

/**
 * Generic job representation — handlers code against this, not pg-boss.
 */
export interface Job<T> {
  id: string;
  name: string;
  data: T;
  retryCount: number;
  retryLimit: number;
  createdOn: Date;
  startedOn: Date | null;
  completedOn: Date | null;
}

/**
 * Options for sending a job.
 */
export interface SendOptions {
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  startAfter?: Date | string | number;
  singletonKey?: string;
  logger?: Logger;
}

/**
 * Pure queue configuration — no runtime behavior, just schema + defaults.
 */
export interface QueueConfig<T extends z.ZodType = z.ZodType> {
  name: string;
  schema: T;
  defaultSendOptions?: Omit<SendOptions, "logger">;
}

export type JobHandler<T> = (job: Job<T>) => Promise<void>;

/**
 * Queue provider contract — implement this to swap the underlying queue system.
 */
export interface QueueProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  setLogger(logger: Logger): void;

  send<T extends z.ZodType>(
    queue: QueueConfig<T>,
    data: z.infer<T>,
    options?: SendOptions,
  ): Promise<string | null>;

  work<T extends z.ZodType>(
    queue: QueueConfig<T>,
    handler: JobHandler<z.infer<T>>,
  ): Promise<void>;

  schedule<T extends z.ZodType>(
    queue: QueueConfig<T>,
    cron: string,
  ): Promise<void>;
}
