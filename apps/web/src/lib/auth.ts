import { db } from "@__APP_NAME__/db";
import { betterAuth, Session } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { customSession } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ac, admin, member } from "./auth/permissions";
import type { Role } from "./auth/roles";

// Options are defined separately so customSession can infer the correct types
// Ref: https://www.better-auth.com/docs/concepts/session-management#caveats-on-customizing-session-response
const options = {
  databaseHooks: {
    session: {
      create: {
        before: async (session: Session) => {
          const dbMember = await db.member.findFirst({
            where: {
              userId: session.userId,
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: dbMember?.organizationId || null,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        admin,
        member,
      },
      allowUserToCreateOrganization: true,
      creatorRole: "admin",
    }),
  ],
};

export const auth = betterAuth({
  appName: "__APP_TITLE__",
  telemetry: {
    enabled: false,
  },

  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  session: {
    cookieCache: {
      enabled: false,
    },
  },

  ...options,

  plugins: [
    ...options.plugins,
    adminPlugin(),
    customSession(async ({ user, session }) => {
      const dbMember = await db.member.findFirst({
        where: {
          userId: user.id,
          organizationId:
            (session as Record<string, unknown>).activeOrganizationId as
              | string
              | undefined,
        },
      });

      return {
        role: (dbMember?.role as Role) || null,
        user,
        session,
      };
    }, options),
    tanstackStartCookies(), // Must be last
  ],
});
