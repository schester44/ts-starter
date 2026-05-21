import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { tracingMiddleware } from "@/middleware/tracing";

/**
 * Ensures the response has a non-null body. TanStack Start's internal fetch
 * forwarding crashes with "expected non-null body source" when the Response
 * body is null (e.g. Better Auth error responses).
 */
async function safeAuthHandler(request: Request): Promise<Response> {
  const response = await auth.handler(request);

  if (response.body === null) {
    return new Response(response.statusText || "", {
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
      GET: ({ request }) => {
        return safeAuthHandler(request);
      },
      POST: ({ request }) => {
        return safeAuthHandler(request);
      },
    },
  },
});
