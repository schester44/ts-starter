import { createFileRoute } from "@tanstack/react-router";
import { tracingMiddleware } from "@/middleware/tracing";
import { apiKeyAuth } from "@/middleware/api-key-auth";

export const Route = createFileRoute("/api/example/")({
  server: {
    middleware: [tracingMiddleware, apiKeyAuth],
    handlers: {
      GET: ({ context }) => {
        return Response.json({
          message: "Authenticated successfully",
          apiKeyId: context.apiKeyId,
          organizationId: context.activeOrganizationId,
        });
      },
    },
  },
});
