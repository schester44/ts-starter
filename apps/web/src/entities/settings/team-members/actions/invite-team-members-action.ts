import { auth } from "@/lib/auth";
import { actionAuth } from "@/middleware/auth";
import { roleSchema } from "@/lib/auth/roles";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";

export const inviteTeamMembersAction = createServerFn()
  .middleware([actionAuth])
  .inputValidator(
    z.object({
      emails: z.array(z.string().email()),
      role: roleSchema,
    }),
  )
  .handler(async ({ context: { activeOrganizationId }, data }) => {
    for (const email of data.emails) {
      await auth.api.createInvitation({
        body: {
          email,
          role: data.role,
          organizationId: activeOrganizationId,
          resend: true,
        },
        headers: getRequestHeaders(),
      });
    }

    return { success: true };
  });
