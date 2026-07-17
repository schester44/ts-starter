import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsLayout,
});

const tabs = [
  { label: "Team", to: "/settings/team" },
  { label: "Organization", to: "/settings/organization" },
] as const;

function SettingsLayout() {
  return (
    <div className="p-4 md:p-6 xl:p-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent -mb-px transition-colors"
            activeProps={{
              className:
                "px-4 py-2 text-sm font-medium text-foreground border-b-2 border-primary -mb-px transition-colors",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
