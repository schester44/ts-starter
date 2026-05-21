import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiEmailInput } from "./multi-email-input";
import type { Role } from "@/lib/auth/roles";

interface AddTeamMemberProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (emails: string[], role: Role) => void;
}

export function AddTeamMember({
  open,
  onOpenChange,
  onSubmit,
}: AddTeamMemberProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role>("member");

  const resetForm = () => {
    setEmails([]);
    setSelectedRole("member");
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleSubmit = () => {
    onSubmit(emails, selectedRole);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
          <DialogDescription>
            Invite new members to your team. They will receive an email
            invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <MultiEmailInput
              onEmailsChange={setEmails}
              placeholder="Enter email addresses separated by commas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            disabled={emails.length === 0 || !selectedRole}
            onClick={handleSubmit}
          >
            {emails.length === 1 ? "Send Invite" : "Send Invites"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
