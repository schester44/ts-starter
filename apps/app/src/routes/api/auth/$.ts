import { auth } from "@/lib/auth";
import { tracingMiddleware } from "@/middleware/tracing";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    middleware: [tracingMiddleware],
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
});
