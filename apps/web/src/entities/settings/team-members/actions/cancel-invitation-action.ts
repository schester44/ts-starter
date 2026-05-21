import { auth } from "@/lib/auth";
import { actionAuth } from "@/middleware/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import z from "zod";

export const cancelInvitationAction = createServerFn()
  .middleware([actionAuth])
  .inputValidator(
    z.object({
      invitationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await auth.api.cancelInvitation({
      body: {
        invitationId: data.invitationId,
      },
      headers: getRequestHeaders(),
    });

    return { success: true };
  });
