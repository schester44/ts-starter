import { auth } from "@/lib/auth";
import { tracingMiddleware } from "@/middleware/tracing";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Ensures the Response always has a non-null body.
 * Node's undici crashes with "expected non-null body source" when
 * a Response has status < 300 but a null body (e.g. Better Auth error responses).
 */
async function safeHandler(request: Request): Promise<Response> {
  const response = await auth.handler(request);

  if (response.body === null) {
    return new Response("", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return response;
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    middleware: [tracingMiddleware],
    handlers: {
      GET: ({ request }: { request: Request }) => safeHandler(request),
      POST: ({ request }: { request: Request }) => safeHandler(request),
    },
  },
});
