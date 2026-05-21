import { auth } from "@/lib/auth";
import { actionAuth } from "@/middleware/auth";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";

export const deleteUserAction = createServerFn()
  .middleware([actionAuth])
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ context: { user, activeOrganizationId }, data }) => {
    if (user.id === data.userId) {
      throw new Error("You cannot delete your own account");
    }

    const userToDelete = await db.user.findFirst({
      where: {
        id: data.userId,
        members: {
          some: { organizationId: activeOrganizationId },
        },
      },
    });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    await auth.api.removeMember({
      body: {
        memberIdOrEmail: userToDelete.email,
        organizationId: activeOrganizationId,
      },
      headers: getRequestHeaders(),
    });

    return { success: true };
  });
