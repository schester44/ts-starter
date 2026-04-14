import { db } from "@mailtrail/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
  appName: "Mailtrail",
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

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const member = await db.member.findFirst({
            where: {
              userId: session.userId,
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: member?.organizationId || null,
            },
          };
        },
      },
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    tanstackStartCookies(), // Must be last
  ],
});
