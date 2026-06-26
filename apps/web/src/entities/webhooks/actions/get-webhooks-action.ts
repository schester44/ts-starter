import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";

export const getWebhooks = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .handler(async ({ context }) => {
    const webhooks = await db.webhookEndpoint.findMany({
      where: {
        organizationId: context.activeOrganizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return webhooks.map((wh) => {
      return {
        id: wh.id,
        url: wh.url,
        name: wh.name,
        createdAt: wh.createdAt,
      };
    });
  });
