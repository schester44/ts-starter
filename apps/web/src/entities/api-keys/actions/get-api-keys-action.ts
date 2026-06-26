import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";

export const getApiKeysAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .handler(async ({ context }) => {
    const apiKeys = await db.apiKey.findMany({
      where: {
        organizationId: context.activeOrganizationId,
      },
      select: {
        id: true,
        keyId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiKeys;
  });
