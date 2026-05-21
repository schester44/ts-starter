import { createFileRoute, useRouteContext } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useRouteContext({ from: "/_authed" });

  return (
    <div className="p-4 md:p-6 xl:p-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Email:</span> {session.user.email}
        </p>
        {session.organization && (
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">Organization:</span>{" "}
            {session.organization.name}
          </p>
        )}
      </div>
    </div>
  );
}
