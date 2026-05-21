import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchSession } from "@/lib/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const session = await fetchSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (!session.organization) {
      throw redirect({ to: "/no-org" });
    }

    return { session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = Route.useRouteContext();

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} organization={session.organization} />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
