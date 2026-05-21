import { auth } from "@/lib/auth";
import { actionAuth } from "@/middleware/auth";
import { roleSchema } from "@/lib/auth/roles";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";

export const updateUserAction = createServerFn()
  .middleware([actionAuth])
  .inputValidator(
    z.object({
      userId: z.string(),
      role: roleSchema,
    }),
  )
  .handler(async ({ context: { activeOrganizationId }, data }) => {
    const member = await db.member.findFirst({
      where: {
        userId: data.userId,
        organizationId: activeOrganizationId,
      },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    await auth.api.updateMemberRole({
      body: {
        role: [data.role],
        memberId: member.id,
        organizationId: activeOrganizationId,
      },
      headers: getRequestHeaders(),
    });

    return { success: true };
  });
