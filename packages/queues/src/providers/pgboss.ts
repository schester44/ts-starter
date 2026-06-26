import {
  trace,
  context,
  propagation,
  SpanStatusCode,
} from "@opentelemetry/api";

import PgBoss, { type ConstructorOptions } from "pg-boss";
import { z } from "zod";
import type {
  QueueProvider,
  QueueConfig,
  Job,
  JobHandler,
  SendOptions,
} from "../types";
import type { Logger } from "@__APP_NAME__/observe";

const tracer = trace.getTracer("queues");

export interface PgBossProviderOptions {
  database: ConstructorOptions;
  onMonitorStates?: (monitorStates: PgBoss.MonitorStates) => void;
}

/**
 * pg-boss implementation of the QueueProvider interface.
 *
 * All pg-boss coupling is contained here. Handlers and queue definitions
 * never import pg-boss directly — they use the generic Job<T> type
 * and QueueConfig<T> from types.ts.
 */
export class PgBossProvider implements QueueProvider {
  private boss: PgBoss;
  private started = false;
  private starting = false;
  private logger: Logger;
  private ensuredQueues = new Set<string>();

  private __testQueuedJobs: Array<{
    name: string;
    data: Record<string, unknown>;
  }> = [];

  constructor({ database, onMonitorStates }: PgBossProviderOptions) {
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
    if (this.started) return;

    if (this.starting) {
      // Wait for in-progress startup
      const deadline = Date.now() + 10_000;
      while (this.starting && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.started) return;
      throw new Error("Timeout waiting for PgBoss to start");
    }

    this.starting = true;
    try {
      await this.boss.start();
      this.started = true;
    } finally {
      this.starting = false;
    }
  }

  async stop() {
    await this.boss.stop();
    this.started = false;
  }

  private async ensureQueue(name: string) {
    if (this.ensuredQueues.has(name)) return;

    await this.start();
    const queue = await this.boss.getQueue(name);
    if (!queue) {
      this.logger.debug({ msg: `Creating queue: ${name}` });
      await this.boss.createQueue(name);
    }
    this.ensuredQueues.add(name);
  }

  async send<T extends z.ZodType>(
    queue: QueueConfig<T>,
    data: z.infer<T>,
    options?: SendOptions,
  ): Promise<string | null> {
    const sendLogger = options?.logger || this.logger;

    return tracer.startActiveSpan(
      "queue.send",
      {
        attributes: {
          "queue.name": queue.name,
          component: "producer",
        },
      },
      async (span) => {
        await this.ensureQueue(queue.name);

        // Propagate trace context via W3C headers
        const carrier: Record<string, string> = {};
        propagation.inject(context.active(), carrier);

        const pgBossOptions: PgBoss.SendOptions = {
          ...(queue.defaultSendOptions || {}),
          ...(options || {}),
        };

        try {
          const jobId = await this.boss.send(
            queue.name,
            { ...(data as object), _traceCtx: carrier },
            pgBossOptions,
          );

          if (process.env.NODE_ENV === "test") {
            this.__testQueuedJobs.push({
              name: queue.name,
              data: data as Record<string, unknown>,
            });
          }

          if (!jobId) {
            throw new Error("Failed to enqueue job - pg-boss returned null");
          }

          span.setAttribute("job.id", jobId);
          span.setAttribute("job.name", queue.name);
          span.end();

          return jobId;
        } catch (error) {
          sendLogger.error({
            msg: `Failed to send job to queue ${queue.name}`,
            error,
          });

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.recordException(error as Error);
          span.end();

          throw error;
        }
      },
    );
  }

  async work<T extends z.ZodType>(
    queue: QueueConfig<T>,
    handler: JobHandler<z.infer<T>>,
  ): Promise<void> {
    await this.ensureQueue(queue.name);

    await this.boss.work<{
      _traceCtx?: Record<string, string>;
    } | null>(queue.name, { includeMetadata: true }, async ([pgBossJob]) => {
      if (!pgBossJob) return;

      const data = pgBossJob.data || {};

      this.logger.debug({
        msg: "Processing job",
        jobId: pgBossJob.id,
        queue: queue.name,
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
              "job.id": pgBossJob.id,
              "job.name": pgBossJob.name,
              "job.retry_count": pgBossJob.retryCount,
              "job.retry_limit": pgBossJob.retryLimit,
            },
          },
          async (span) => {
            try {
              const validatedData = queue.schema.parse(pgBossJob.data);

              // Map pg-boss job to generic Job<T>
              const job: Job<z.infer<T>> = {
                id: pgBossJob.id,
                name: pgBossJob.name,
                data: validatedData,
                retryCount: pgBossJob.retryCount,
                retryLimit: pgBossJob.retryLimit,
                createdOn: pgBossJob.createdOn,
                startedOn: pgBossJob.startedOn,
                completedOn: pgBossJob.completedOn,
              };

              await handler(job);
              span.end();
            } catch (error) {
              const isWithinRetryLimit =
                pgBossJob.retryCount < pgBossJob.retryLimit;

              if (isWithinRetryLimit) {
                this.logger.warn({
                  msg: "Error processing job, within retry limit - marking as failed for retry",
                  details: {
                    jobId: pgBossJob.id,
                    queue: queue.name,
                    retryCount: pgBossJob.retryCount,
                    retryLimit: pgBossJob.retryLimit,
                  },
                  error:
                    error instanceof Error ? error.message : String(error),
                });

                await this.boss.fail(
                  pgBossJob.name,
                  pgBossJob.id,
                  error instanceof Error
                    ? error
                    : { message: String(error) },
                );

                span.end();
                return;
              }

              this.logger.error({
                msg: "Error processing job",
                details: { jobId: pgBossJob.id, queue: queue.name },
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
      });
    });
  }

  async schedule<T extends z.ZodType>(
    queue: QueueConfig<T>,
    cron: string,
  ): Promise<void> {
    await this.ensureQueue(queue.name);

    this.logger.debug({
      msg: `Scheduling recurring job for queue: ${queue.name} with cron: ${cron}`,
    });

    await this.boss.schedule(queue.name, cron);
  }
}
