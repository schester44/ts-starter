import { auth } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit-log";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { roleSchema } from "@/lib/auth/roles";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";

export const inviteTeamMembersAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(
    z.object({
      emails: z.array(z.string().email()),
      role: roleSchema,
    }),
  )
  .handler(async ({ context: { activeOrganizationId, user }, data }) => {
    for (const email of data.emails) {
      const invitation = await auth.api.createInvitation({
        body: {
          email,
          role: data.role,
          organizationId: activeOrganizationId,
          resend: true,
        },
        headers: getRequestHeaders(),
      });

      await db.$transaction((tx) =>
        logAuditEntry(tx, {
          organizationId: activeOrganizationId,
          action: "MEMBER_INVITED",
          entityType: "INVITATION",
          entityId: invitation.id,
          actor: { type: "USER", id: user.id, name: user.name },
          metadata: { email, role: data.role },
        }),
      );
    }

    return { success: true };
  });
