/**
 * Re-exports from @opentelemetry/api for convenient access throughout the app.
 *
 * Usage:
 *   import { trace, context, SpanStatusCode } from "@__APP_NAME__/observe";
 *
 *   const tracer = trace.getTracer("my-service");
 *   const span = tracer.startSpan("my-operation");
 */
export {
  trace,
  context,
  propagation,
  SpanStatusCode,
  SpanKind,
} from "@opentelemetry/api";

export type { Span, Tracer, SpanOptions } from "@opentelemetry/api";

import { trace } from "@opentelemetry/api";

/**
 * Get a tracer instance for the given name.
 */
export function getTracer(name: string) {
  return trace.getTracer(name);
}

/**
 * Wrap an async function in a span.
 *
 * @example
 * const result = await withSpan("fetchUser", async (span) => {
 *   span.setAttribute("user.id", userId);
 *   return await db.user.findUnique({ where: { id: userId } });
 * });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: import("@opentelemetry/api").Span) => Promise<T>,
  options?: {
    tracer?: string;
    attributes?: Record<string, string | number | boolean>;
  },
): Promise<T> {
  const tracer = trace.getTracer(options?.tracer ?? "__APP_NAME__");

  return tracer.startActiveSpan(name, async (span) => {
    if (options?.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        span.setAttribute(key, value);
      }
    }

    try {
      const result = await fn(span);
      span.end();

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: 2, // SpanStatusCode.ERROR
        message: (error as Error).message,
      });
      span.end();
      throw error;
    }
  });
}
