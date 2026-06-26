import { logger } from "@/lib/logger";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const schema = z.object({
  apiKeyId: z.string().uuid("Invalid API key ID format"),
});

export const deleteApiKeyAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(schema)
  .handler(async ({ data, context }) => {
    try {
      await db.apiKey.delete({
        where: {
          id: data.apiKeyId,
          organizationId: context.activeOrganizationId,
        },
      });

      return { success: true };
    } catch (error) {
      logger.error({
        msg: "Error deleting API key",
        error,
      });

      return { success: false, error: (error as Error).message };
    }
  });
