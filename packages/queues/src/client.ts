import {
  trace,
  context,
  propagation,
  SpanStatusCode,
} from "@opentelemetry/api";

import PgBoss, { type ConstructorOptions } from "pg-boss";
import { z } from "zod";
import type { QueueDefinition } from "./types";
import type { Logger } from "@__APP_NAME__/observe";

interface QueueClientOptions {
  database: ConstructorOptions;
  onMonitorStates?: (monitorStates: PgBoss.MonitorStates) => void;
}

const tracer = trace.getTracer("queues");

export class QueueClient {
  private boss: PgBoss;
  private started = false;
  private starting = false;
  private logger: Logger;

  private __testQueuedJobs: Array<{
    name: string;
    data: Record<string, unknown>;
  }> = [];

  constructor({ database, onMonitorStates }: QueueClientOptions) {
    this.boss = new PgBoss(database);

    if (onMonitorStates) {
      this.boss.on("monitor-states", onMonitorStates);
    }

    this.boss.on("error", (error) => {
      this.logger?.error({
        msg: "PgBoss error",
        error,
      });
    });

    this.logger = {
      debug: (obj: object | string) => {
        console.debug(typeof obj === "string" ? obj : JSON.stringify(obj));
      },
      info: (obj: object | string) => {
        console.info(typeof obj === "string" ? obj : JSON.stringify(obj));
      },
      error: (obj: object | string) => {
        console.error(typeof obj === "string" ? obj : JSON.stringify(obj));
      },
      warn: (obj: object | string) => {
        console.warn(typeof obj === "string" ? obj : JSON.stringify(obj));
      },
    };
  }

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  resetTestJobs() {
    this.__testQueuedJobs = [];
  }

  get testQueuedJobs() {
    return this.__testQueuedJobs;
  }

  async start() {
    if (!this.started && !this.starting) {
      this.starting = true;
      await this.boss.start();
      this.started = true;
      this.starting = false;
    } else if (this.starting) {
      while (this.starting) {
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 100)),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout waiting for PgBoss to start")),
              10000,
            ),
          ),
        ]);
      }
    }

    if (this.started) return;
    await this.boss.start();

    this.started = true;
    this.starting = false;
  }

  async stop() {
    await this.boss.stop();
  }

  create<T extends z.ZodType>(config: {
    name: string;
    schema: T;
    options?: PgBoss.Queue;
    sendOptions?: PgBoss.SendOptions;
  }): QueueDefinition<T> {
    const { name, schema } = config;

    return {
      name,
      schema,
      schedule: async ({ cron }) => {
        await this.start();

        const queue = await this.boss.getQueue(name);

        if (!queue) {
          this.logger.debug({
            msg: `Creating queue: ${name}`,
          });

          await this.boss.createQueue(name, config.options);
        }

        this.logger.debug({
          msg: `Scheduling recurring job for queue: ${name} with cron: ${cron}`,
        });

        await this.boss.schedule(name, cron);
      },
      send: async (data, options) => {
        const logger = options?.logger || this.logger;

        return tracer.startActiveSpan(
          "queue.send",
          {
            attributes: {
              "queue.name": name,
              component: "producer",
            },
          },
          async (span) => {
            await this.start();

            const queue = await this.boss.getQueue(name);

            if (!queue) {
              logger.debug({
                msg: `Creating queue: ${name}`,
              });

              await this.boss.createQueue(name, config.options);
            }

            // Propagate trace context via W3C headers
            const carrier: Record<string, string> = {};
            propagation.inject(context.active(), carrier);

            try {
              const jobId = await this.boss.send(
                name,
                { ...(data as object), _traceCtx: carrier },
                {
                  ...(config.sendOptions || {}),
                  ...(options || {}),
                },
              );

              if (process.env.NODE_ENV === "test") {
                this.__testQueuedJobs.push({
                  name,
                  data: data as Record<string, unknown>,
                });
              }

              if (!jobId) {
                throw new Error(
                  "Failed to enqueue job - pg-boss returned null",
                );
              }

              span.setAttribute("job.id", jobId);
              span.setAttribute("job.name", name);
              span.end();

              return jobId;
            } catch (error) {
              logger.error({
                msg: `Failed to send job to queue ${name}`,
                error,
              });

              span.setStatus({
                code: SpanStatusCode.ERROR,
                message:
                  error instanceof Error ? error.message : String(error),
              });
              span.recordException(error as Error);
              span.end();

              throw error;
            }
          },
        );
      },
      work: async (handler) => {
        await this.start();

        const queue = await this.boss.getQueue(name);

        if (!queue) {
          this.logger.debug({
            msg: `Creating queue: ${name}`,
          });

          await this.boss.createQueue(name, config.options);
        }

        return this.boss.work<{
          _traceCtx?: Record<string, string>;
        } | null>(name, { includeMetadata: true }, async ([job]) => {
          if (!job) return;

          const data = job.data || {};

          this.logger.debug({
            msg: "Processing job",
            jobId: job.id,
            queue: name,
          });

          // Extract propagated trace context
          const parentCtx = data._traceCtx
            ? propagation.extract(context.active(), data._traceCtx)
            : context.active();

          await context.with(parentCtx, async () => {
            await tracer.startActiveSpan(
              "queue.work",
              {
                attributes: {
                  component: "consumer",
                  "job.id": job.id,
                  "job.name": job.name,
                  "job.retry_count": job.retryCount,
                  "job.retry_limit": job.retryLimit,
                },
              },
              async (span) => {
                try {
                  const validatedData = schema.parse(job.data);

                  await handler({ ...job, data: validatedData });
                  span.end();
                } catch (error) {
                  const isWithinRetryLimit =
                    job.retryCount < job.retryLimit;

                  if (isWithinRetryLimit) {
                    this.logger.warn({
                      msg: "Error processing job, but within retry limit - marking as failed to allow retry",
                      details: {
                        jobId: job.id,
                        queue: name,
                        retryCount: job.retryCount,
                        retryLimit: job.retryLimit,
                      },
                      error:
                        error instanceof Error
                          ? error.message
                          : String(error),
                    });

                    await this.boss.fail(
                      job.name,
                      job.id,
                      error instanceof Error
                        ? error
                        : { message: String(error) },
                    );

                    span.end();
                    return;
                  }

                  this.logger.error({
                    msg: "Error processing job",
                    details: { jobId: job.id, queue: name },
                    error,
                  });

                  span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message:
                      error instanceof Error
                        ? error.message
                        : String(error),
                  });
                  span.recordException(error as Error);
                  span.end();

                  throw error;
                }
              },
            );
          });
        });
      },
    };
  }
}

export const createQueueClient = (opts: QueueClientOptions) => {
  return new QueueClient(opts);
};
