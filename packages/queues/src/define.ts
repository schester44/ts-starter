import { z } from "zod";
import type { QueueConfig, SendOptions } from "./types";

/**
 * Define a queue as pure configuration.
 *
 * This creates no runtime connections — it's just a typed config object
 * that gets passed to a QueueProvider for actual send/work operations.
 */
export function defineQueue<T extends z.ZodType>(config: {
  name: string;
  schema: T;
  sendOptions?: Omit<SendOptions, "logger">;
}): QueueConfig<T> {
  return {
    name: config.name,
    schema: config.schema,
    defaultSendOptions: config.sendOptions,
  };
}
