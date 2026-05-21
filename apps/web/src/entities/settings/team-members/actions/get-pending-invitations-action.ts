import { actionAuth } from "@/middleware/auth";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";

export const getPendingInvitations = createServerFn({ method: "GET" })
  .middleware([actionAuth])
  .handler(async ({ context: { activeOrganizationId } }) => {
    const invitations = await db.invitation.findMany({
      where: {
        organizationId: activeOrganizationId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { expiresAt: "asc" },
    });

    return invitations;
  });
