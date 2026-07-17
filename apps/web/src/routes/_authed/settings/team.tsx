import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AddTeamMember } from "@/components/add-team-member-modal";
import { DeleteTeamMember } from "@/components/delete-team-member-modal";
import { EditUserModal } from "@/components/edit-user-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Mail,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { getTeamMembers } from "@/entities/settings/team-members/actions/get-team-members-action";
import { deleteUserAction } from "@/entities/settings/team-members/actions/delete-team-members-action";
import { inviteTeamMembersAction } from "@/entities/settings/team-members/actions/invite-team-members-action";
import { updateUserAction } from "@/entities/settings/team-members/actions/update-user-action";
import { getPendingInvitations } from "@/entities/settings/team-members/actions/get-pending-invitations-action";
import { cancelInvitationAction } from "@/entities/settings/team-members/actions/cancel-invitation-action";
import type { Role } from "@/lib/auth/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authed/settings/team")({
  component: TeamPage,
  loader: async () => {
    const [teamMembers, pendingInvitations] = await Promise.all([
      getTeamMembers(),
      getPendingInvitations(),
    ]);

    return { teamMembers, pendingInvitations };
  },
});

function TeamPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    string | null
  >(null);

  const handleAddMembers = async (emails: string[], role: Role) => {
    try {
      await inviteTeamMembersAction({ data: { emails, role } });
      toast.success(
        `Invites sent to ${emails.length} ${emails.length === 1 ? "member" : "members"}`,
      );
      await router.invalidate();
    } catch (error) {
      toast.error(
        `Failed to send invites. ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setAddMemberOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUserAction({ data: { userId } });
      toast.success("Member removed successfully");
      await router.invalidate();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(
        `Failed to remove member. ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditUser = async (editData: { role: Role }) => {
    if (!userToEdit) return;
    try {
      await updateUserAction({
        data: { userId: userToEdit.id, role: editData.role },
      });
      toast.success("User updated successfully");
      await router.invalidate();
      setEditUserOpen(false);
      setUserToEdit(null);
    } catch (error) {
      toast.error(
        `Failed to update user. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingInvitationId(invitationId);
    try {
      await cancelInvitationAction({ data: { invitationId } });
      toast.success("Invitation cancelled");
      await router.invalidate();
    } catch (error) {
      toast.error(
        `Failed to cancel invitation. ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setCancellingInvitationId(null);
    }
  };

  const formatExpiresAt = (expiresAt: Date) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires in 1 day";
    return `Expires in ${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their access
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setAddMemberOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 py-4">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.teamMembers.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              data.teamMembers.items.map((member) => {
                const isCurrentUser =
                  member.id === data.teamMembers.currentUserId;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="rounded">
                          <AvatarImage
                            src={member.image || undefined}
                            alt={member.name}
                          />
                          <AvatarFallback>
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {member.name}
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {member.members[0]?.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToEdit({
                                id: member.id,
                                name: member.name,
                                role: member.members[0]?.role || "member",
                              });
                              setEditUserOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          {!isCurrentUser && (
                            <DropdownMenuItem
                              className="text-rose-600 focus:text-rose-600"
                              onClick={() => {
                                setUserToDelete({
                                  id: member.id,
                                  name: member.name,
                                });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data.pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Pending Invitations
            </h2>
            <p className="text-sm text-muted-foreground">
              Invitations that have been sent but not yet accepted
            </p>
          </div>

          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 py-4">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="pl-4 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{invitation.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {invitation.role ?? "member"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatExpiresAt(invitation.expiresAt)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {invitation.user.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={cancellingInvitationId === invitation.id}
                      >
                        <span className="sr-only">Cancel invitation</span>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DeleteTeamMember
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete.id)}
        userToDelete={userToDelete}
        isDeleting={isDeleting}
      />

      <AddTeamMember
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSubmit={handleAddMembers}
      />

      <EditUserModal
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        onSubmit={handleEditUser}
        user={userToEdit}
      />
    </div>
  );
}
