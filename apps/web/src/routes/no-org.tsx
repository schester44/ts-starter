import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/no-org")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md p-6 bg-card rounded-lg border text-center shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">No Organization Found</h1>
        <p className="text-muted-foreground mb-6">
          You're not currently a member of any organization. Please contact your
          administrator to be added.
        </p>
      </div>
    </div>
  );
}
