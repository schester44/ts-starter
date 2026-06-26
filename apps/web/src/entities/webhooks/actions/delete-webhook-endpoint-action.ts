import { logger } from "@/lib/logger";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const schema = z.object({
  webhookId: z.string().uuid("Invalid webhook ID format"),
});

export const deleteWebhookEndpointAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(schema)
  .handler(async ({ data, context }) => {
    try {
      await db.webhookEndpoint.delete({
        where: {
          id: data.webhookId,
          organizationId: context.activeOrganizationId,
        },
      });

      return { success: true };
    } catch (error) {
      logger.error({
        msg: "Error deleting webhook endpoint",
        error,
        webhookId: data.webhookId,
        organizationId: context.activeOrganizationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
