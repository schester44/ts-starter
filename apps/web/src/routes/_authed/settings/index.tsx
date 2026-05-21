import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authed/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="p-4 md:p-6 xl:p-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/settings/team">
          <div className="cursor-pointer rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage team members, roles, and invitations
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
