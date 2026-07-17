import {
  Settings,
  LayoutDashboard,
  Code,
  ChevronRight,
  Key,
  Webhook,
  Activity,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { PermissionGate } from "./permission-gate";
import { UserMenu } from "./user-menu";
import { OrgSwitcher } from "./org-switcher";

interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
}

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  organization: Organization | null;
  organizations: Organization[];
}

export function AppSidebar({
  user,
  organization,
  organizations,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher
          organization={organization}
          organizations={organizations}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link
                    to="/dashboard"
                    activeProps={{ className: "bg-sidebar-accent" }}
                  >
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link
                    to="/settings"
                    activeProps={{ className: "bg-sidebar-accent" }}
                  >
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Audit Log">
                  <Link
                    to="/settings/audit-log"
                    activeProps={{ className: "bg-sidebar-accent" }}
                  >
                    <ClipboardList />
                    <span>Audit Log</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <PermissionGate resource="developerTools" action="view">
                <SidebarMenuItem>
                  {/* Expanded state - show collapsible */}
                  <Collapsible
                    defaultOpen={false}
                    className="group/collapsible group-data-[collapsible=icon]:hidden"
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Developers">
                        <Code />
                        <span>Developers</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to="/developers/api-keys"
                              activeProps={{ className: "bg-sidebar-accent" }}
                            >
                              <Key />
                              <span>API Keys</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to="/developers/webhooks"
                              activeProps={{ className: "bg-sidebar-accent" }}
                            >
                              <Webhook />
                              <span>Webhooks</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link
                              to="/developers/jobs"
                              activeProps={{ className: "bg-sidebar-accent" }}
                            >
                              <Activity />
                              <span>Background Jobs</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Collapsed icon state - show dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Developers"
                        className="hidden group-data-[collapsible=icon]:flex"
                      >
                        <Code />
                        <span>Developers</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="w-48"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          to="/developers/api-keys"
                          className="flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" />
                          <span>API Keys</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/developers/webhooks"
                          className="flex items-center gap-2"
                        >
                          <Webhook className="h-4 w-4" />
                          <span>Webhooks</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/developers/jobs"
                          className="flex items-center gap-2"
                        >
                          <Activity className="h-4 w-4" />
                          <span>Background Jobs</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </PermissionGate>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
