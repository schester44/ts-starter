import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { withSpan, SpanStatusCode } from "@__APP_NAME__/observe";

async function handleAuthRequest(request: Request) {
  const url = new URL(request.url);
  const authAction = url.pathname.replace("/api/auth/", "") || "unknown";

  return withSpan(
    `auth.${authAction}`,
    async (span) => {
      span.setAttribute("auth.action", authAction);
      span.setAttribute("http.method", request.method);
      span.setAttribute("http.url", url.pathname);

      const response = await auth.handler(request);

      span.setAttribute("http.status_code", response.status);

      if (response.status >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Auth request failed with status ${response.status}`,
        });
      }

      return response;
    },
    { tracer: "__APP_NAME__-auth" },
  );
}

export const Route = createFileRoute("/api/auth/$")({
  // @ts-expect-error — server handlers processed by TanStack Start vite plugin
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleAuthRequest(request),
      POST: ({ request }: { request: Request }) => handleAuthRequest(request),
    },
  },
});
