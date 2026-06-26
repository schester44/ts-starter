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
import { Plus, Copy, AlertTriangle, Key } from "lucide-react";
import { createApiKeyAction } from "@/entities/api-keys/actions/create-api-key-action";
import { useRouter } from "@tanstack/react-router";

export function ApiKeyCreationModal() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [createdKeyId, setCreatedKeyId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKeyName.trim()) {
      toast.error("Please enter an API key name");

      return;
    }

    setIsLoading(true);

    try {
      const result = await createApiKeyAction({
        data: {
          name: apiKeyName,
        },
      });

      setCreatedApiKey(result.apiKey);
      setCreatedKeyId(result.keyId);
      setApiKeyName("");
      await router.invalidate();
      setIsCreateModalOpen(false);
      setIsKeyModalOpen(true);
      toast.success("API key created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(createdApiKey);
      toast.success("API key copied to clipboard");
    } catch {
      toast.error("Failed to copy API key");
    }
  };

  const closeKeyModal = () => {
    setIsKeyModalOpen(false);
    setCreatedApiKey("");
    setCreatedKeyId("");
  };

  return (
    <>
      {/* Create API Key Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-accent">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Create API Key
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div>
              <Label htmlFor="api-key-name" className="mb-1">
                Name
              </Label>
              <Input
                id="api-key-name"
                type="text"
                placeholder="Production API Key"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                A friendly name to identify this API key
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 dark:border-neutral-700 bg-blue-50 dark:bg-neutral-800 p-4">
              <p className="text-blue-800 dark:text-neutral-300 text-sm">
                A new API key will be generated immediately. Make sure to copy
                and store it securely as you won't be able to see it again.
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
              <Button type="submit" disabled={isLoading || !apiKeyName.trim()}>
                {isLoading ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Display Modal */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="max-w-2xl bg-accent">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Key className="h-5 w-5 text-blue-500 dark:text-neutral-400" />
              Your New API Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-neutral-700 bg-amber-50 dark:bg-neutral-800 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-neutral-400 mt-0.5 shrink-0" />
                <div className="text-amber-800 dark:text-neutral-300 text-sm">
                  <strong>Important:</strong> This is the only time your API key
                  will be shown. Store it securely as you won't be able to see it
                  again.
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="api-key-id">Key ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="api-key-id"
                  type="text"
                  value={createdKeyId}
                  readOnly
                  className="font-mono text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                This is the public identifier for your API key
              </p>
            </div>

            <div>
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="api-key"
                  type="text"
                  value={createdApiKey}
                  readOnly
                  className="font-mono text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyApiKey}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Use this key in your API requests by including it in the
                Authorization header
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={closeKeyModal}>I've Saved the API Key</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
