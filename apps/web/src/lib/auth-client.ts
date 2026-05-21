import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, admin, member } from "./auth/permissions";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: {
        admin,
        member,
      },
    }),
  ],
});

export const useSession = authClient.useSession;
