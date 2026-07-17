import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { Building2, ChevronsUpDown, Check, Plus, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { usePermission } from "@/hooks/use-permission";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
}

interface OrgSwitcherProps {
  organization: Organization | null;
  organizations: Organization[];
}

export function OrgSwitcher({ organization, organizations }: OrgSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = usePermission();

  const canDeleteOrg = hasPermission("organization", "delete");

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === organization?.id) return;

    await authClient.organization.setActive({ organizationId: orgId });
    router.invalidate();
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    try {
      const slug =
        newOrgSlug.trim() ||
        newOrgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      await authClient.organization.create({
        name: newOrgName.trim(),
        slug,
      });

      setCreateOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      router.invalidate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {organization?.name ?? "No Organization"}
                  </span>
                  {organization?.slug && (
                    <span className="truncate text-xs">
                      {organization.slug}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitchOrg(org.id)}
                    className="cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.id === organization?.id && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateOpen(true)}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </DropdownMenuItem>
              {canDeleteOrg && organization && (
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Organization
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmName("");
        }}
      >
        <DialogContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!organization || deleteConfirmName !== organization.name)
                return;

              setIsDeleting(true);
              try {
                await authClient.organization.delete({
                  organizationId: organization.id,
                });

                setDeleteOpen(false);
                setDeleteConfirmName("");
                router.invalidate();
              } catch (error) {
                toast.error(
                  `Failed to delete organization. ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                );
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Delete Organization</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. All data
                associated with{" "}
                <span className="font-semibold text-foreground">
                  {organization?.name}
                </span>{" "}
                will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="delete-confirm">
                Type{" "}
                <span className="font-semibold">{organization?.name}</span> to
                confirm
              </Label>
              <Input
                id="delete-confirm"
                placeholder={organization?.name ?? ""}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  deleteConfirmName !== organization?.name || isDeleting
                }
              >
                {isDeleting ? "Deleting..." : "Delete Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateOrg}>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-slug">
                  Slug{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="org-slug"
                  placeholder="acme-corp"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newOrgName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
