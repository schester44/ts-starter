import { auth } from "@/lib/auth";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const fetchSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });

    if (!session?.user) {
      return null;
    }

    const memberships = await db.member.findMany({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    const organization = memberships.find(
      (m) => m.organization.id === session.session.activeOrganizationId,
    )?.organization;

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      },
      session: session.session,
      organization: organization ?? null,
    };
  },
);
