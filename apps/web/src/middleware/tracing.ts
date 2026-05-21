import { createMiddleware } from "@tanstack/react-start";
import {
  trace,
  SpanStatusCode,
  context,
  propagation,
} from "@__APP_NAME__/observe";

const tracer = trace.getTracer("__APP_NAME__");

/**
 * Request-level tracing middleware for API routes.
 *
 * Creates an OpenTelemetry span for each incoming request, extracts
 * propagated trace context from headers, and records status/duration.
 */
export const tracingMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, request }) => {
  const url = new URL(request.url);
  const route = normalizePath(url.pathname);

  // Extract propagated trace context from incoming headers
  const parentContext = propagation.extract(
    context.active(),
    Object.fromEntries(request.headers.entries()),
  );

  return context.with(parentContext, () =>
    tracer.startActiveSpan(
      `${request.method} ${route}`,
      {
        attributes: {
          "http.method": request.method,
          "http.url": request.url,
          "http.route": route,
          "http.target": url.pathname,
        },
      },
      async (span) => {
        const startTime = Date.now();

        try {
          const response = await next();
          const duration = Date.now() - startTime;
          const statusCode = response.response.status;

          span.setAttribute("http.status_code", statusCode);
          span.setAttribute("http.duration_ms", duration);

          if (statusCode >= 500) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${statusCode}`,
            });
          }

          return response;
        } catch (error) {
          const duration = Date.now() - startTime;
          span.setAttribute("http.duration_ms", duration);
          span.recordException(error as Error);

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message,
          });

          throw error;
        } finally {
          span.end();
        }
      },
    ),
  );
});

/**
 * Server function tracing middleware.
 *
 * Creates an OpenTelemetry span for each server function invocation,
 * recording the function name, method, and duration.
 */
export const actionTracingMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, method, serverFnMeta }) => {
  return tracer.startActiveSpan(
    `server_fn ${method} ${serverFnMeta.name}`,
    {
      attributes: {
        "rpc.method": method,
        "rpc.service": serverFnMeta.name,
        "code.filepath": serverFnMeta.filename,
      },
    },
    async (span) => {
      const startTime = Date.now();

      try {
        const response = await next();
        span.setAttribute("rpc.duration_ms", Date.now() - startTime);

        return response;
      } catch (error) {
        span.setAttribute("rpc.duration_ms", Date.now() - startTime);
        span.recordException(error as Error);

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });

        throw error;
      } finally {
        span.end();
      }
    },
  );
});

/**
 * Normalize URL paths by replacing UUIDs with `:id` placeholders
 * to reduce span cardinality.
 */
function normalizePath(path: string) {
  return path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
    "/:id",
  );
}
