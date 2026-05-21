import { auth as ba } from "@/lib/auth";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export const actionAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const headers = getRequestHeaders();

    const session = await ba.api.getSession({
      headers,
    });

    if (!session?.user) {
      throw redirect({ to: "/" });
    }

    const activeOrganizationId = session.session.activeOrganizationId as string;

    return next({
      context: {
        user: {
          id: session.user.id,
          name: session.user.name,
        },
        activeOrganizationId,
      },
    });
  },
);
