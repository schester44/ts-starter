import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/permission-gate";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authed/settings/organization")({
  component: OrganizationPage,
});

function OrganizationPage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const orgName = session.organization?.name ?? "";

  const handleDeleteOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.organization || deleteConfirmName !== orgName) return;

    setIsDeleting(true);
    try {
      await authClient.organization.delete({
        organizationId: session.organization.id,
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Organization</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Name
          </span>
          <span className="text-sm">{orgName}</span>
        </div>
        {session.organization?.slug && (
          <div className="grid gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              Slug
            </span>
            <span className="text-sm">{session.organization.slug}</span>
          </div>
        )}
      </div>

      <PermissionGate resource="organization" action="delete">
        <div className="border border-destructive/30 rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-destructive">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Irreversible and destructive actions
            </p>
          </div>
          <div className="border-t border-destructive/30 p-6 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-medium">Delete this organization</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete{" "}
                <span className="font-semibold">{orgName}</span> and all of its
                data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Organization
            </Button>
          </div>
        </div>
      </PermissionGate>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmName("");
        }}
      >
        <DialogContent>
          <form onSubmit={handleDeleteOrg}>
            <DialogHeader>
              <DialogTitle>Delete Organization</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. All data
                associated with{" "}
                <span className="font-semibold text-foreground">{orgName}</span>{" "}
                will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="delete-confirm">
                Type <span className="font-semibold">{orgName}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                placeholder={orgName}
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
                disabled={deleteConfirmName !== orgName || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
