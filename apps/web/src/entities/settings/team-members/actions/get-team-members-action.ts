import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";

export const getTeamMembers = createServerFn({ method: "GET" })
  .middleware([actionTracingMiddleware, actionAuth])
  .handler(async ({ context: { user, activeOrganizationId } }) => {
    const teamMembers = await db.user.findMany({
      include: {
        members: {
          where: { organizationId: activeOrganizationId },
          select: { role: true },
        },
      },
      where: {
        members: {
          some: { organizationId: activeOrganizationId },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      items: teamMembers,
      currentUserId: user.id,
    };
  });
