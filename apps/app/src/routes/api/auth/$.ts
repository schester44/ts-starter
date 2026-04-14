import { auth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { withSpan, SpanStatusCode } from "@mailtrail/observe";

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
    { tracer: "mailtrail-auth" },
  );
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleAuthRequest(request),
      POST: ({ request }: { request: Request }) => handleAuthRequest(request),
    },
  },
});
