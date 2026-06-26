import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Copy, AlertTriangle } from "lucide-react";
import { createWebhookEndpointAction } from "@/entities/webhooks/actions/create-webhook-endpoint-action";
import { useRouter } from "@tanstack/react-router";

export function WebhookCreationModal() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [createdSecret, setCreatedSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWebhookName.trim()) {
      toast.error("Please enter a webhook name");

      return;
    }

    if (!newWebhookUrl.trim()) {
      toast.error("Please enter a webhook URL");

      return;
    }

    setIsLoading(true);

    try {
      const result = await createWebhookEndpointAction({
        data: {
          name: newWebhookName,
          url: newWebhookUrl,
        },
      });

      setCreatedSecret(result.secret);
      setNewWebhookName("");
      setNewWebhookUrl("");
      await router.invalidate();
      setIsCreateModalOpen(false);
      setIsSecretModalOpen(true);
      toast.success("Webhook endpoint created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create webhook endpoint",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(createdSecret);
      toast.success("Secret copied to clipboard");
    } catch {
      toast.error("Failed to copy secret");
    }
  };

  const closeSecretModal = () => {
    setIsSecretModalOpen(false);
    setCreatedSecret("");
  };

  return (
    <>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Webhook Endpoint</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div>
              <Label
                htmlFor="webhook-name"
                className="mb-1 text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id="webhook-name"
                type="text"
                placeholder="Production Webhook"
                value={newWebhookName}
                onChange={(e) => setNewWebhookName(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                A friendly name to identify this webhook endpoint
              </p>
            </div>
            <div>
              <Label htmlFor="webhook-url" className="mb-1">
                Endpoint URL
              </Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Must be a valid URL that can receive POST requests
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newWebhookName.trim()}
              >
                {isLoading ? "Creating..." : "Create Endpoint"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Secret Display Modal */}
      <Dialog open={isSecretModalOpen} onOpenChange={setIsSecretModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-neutral-400" />
              Webhook Signing Secret
            </DialogTitle>
            <DialogDescription>
              Your webhook endpoint has been created successfully. Please copy
              and securely store your signing secret.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-neutral-700 bg-amber-50 dark:bg-neutral-800 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-neutral-400 mt-0.5 shrink-0" />
                <div className="text-amber-800 dark:text-neutral-300 text-sm">
                  <strong>Important:</strong> This secret will only be shown
                  once. Store it securely as you'll need it to verify webhook
                  payloads.
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="signing-secret">Signing Secret</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="signing-secret"
                  type="text"
                  value={createdSecret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={closeSecretModal}>I've Saved the Secret</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
