import { createAuthClient } from "better-auth/react";
import {
  customSessionClient,
  organizationClient,
} from "better-auth/client/plugins";
import { ac, admin, member } from "./auth/permissions";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    customSessionClient<typeof auth>(),
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
