import pino from "pino";
import { trace, context } from "@opentelemetry/api";
import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Minimal logger interface used across packages.
 *
 * Matches the common subset of pino, console, and custom loggers
 * so services can accept any logger implementation via dependency injection.
 */
export interface Logger {
  debug: (obj: object | string, msg?: string) => void;
  info: (obj: object | string, msg?: string) => void;
  warn: (obj: object | string, msg?: string) => void;
  error: (obj: object | string, msg?: string) => void;
}

const isDev = process.env.NODE_ENV !== "production";

function getRepoRoot(): string {
  try {
    const stdout = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
    });
    return stdout.trim();
  } catch {
    return path.resolve(".");
  }
}

// Ensure logs directory exists in development
if (isDev) {
  const logsDir = join(getRepoRoot(), "logs");
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Create a pino logger instance for a given service.
 *
 * - In development: pretty console output + JSON file in `logs/<service>.log`
 * - In production: JSON to stdout
 * - Automatically injects OpenTelemetry trace/span IDs into every log line
 *
 * @example
 * ```ts
 * import { createLogger } from "@__APP_NAME__/observe";
 * export const logger = createLogger("web");
 * ```
 */
export function createLogger(service: string) {
  return pino(
    {
      base: {
        service,
      },
      mixin() {
        const activeSpan = trace.getSpan(context.active());

        if (activeSpan) {
          const spanContext = activeSpan.spanContext();
          return {
            "trace.id": spanContext.traceId,
            "span.id": spanContext.spanId,
          };
        }

        return {};
      },
      level: process.env.LOG_LEVEL || "debug",
      timestamp: pino.stdTimeFunctions.isoTime,
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
    },
    isDev
      ? pino.multistream([
          // Pretty console output for development
          {
            level: "debug",
            stream: pino.transport({
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                sync: true,
              },
            }),
          },
          // JSON file output for log aggregation
          {
            level: "debug",
            stream: pino.destination({
              dest: join(getRepoRoot(), "logs", `${service}.log`),
              sync: false,
            }),
          },
        ])
      : pino.destination(1), // stdout in production
  );
}
