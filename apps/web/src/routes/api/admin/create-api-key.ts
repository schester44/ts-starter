import { db } from "@__APP_NAME__/db";
import { createFileRoute } from "@tanstack/react-router";
import { tracingMiddleware } from "@/middleware/tracing";
import { nonProdOnly } from "@/middleware/non-prod-only";
import { adminApiKey } from "@/middleware/admin-api-key";
import { createApiKeyHandler } from "./-handlers/create-api-key-handler";

export const Route = createFileRoute("/api/admin/create-api-key")({
  server: {
    middleware: [tracingMiddleware, nonProdOnly, adminApiKey],
    handlers: {
      POST: async ({ request }) => {
        return createApiKeyHandler({ request, db });
      },
    },
  },
});
