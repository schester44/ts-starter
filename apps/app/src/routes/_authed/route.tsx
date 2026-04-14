import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({ to: "/" });
    }

    return { session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
