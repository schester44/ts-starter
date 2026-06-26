import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Key, Trash2 } from "lucide-react";
import { ApiKeyCreationModal } from "@/components/api-key-creation-modal";
import { deleteApiKeyAction } from "@/entities/api-keys/actions/delete-api-key-action";
import { getApiKeysAction } from "@/entities/api-keys/actions/get-api-keys-action";
import { title } from "@/lib/meta";
import { formatDateTime } from "@/lib/formatting";

export const Route = createFileRoute("/_authed/developers/api-keys")({
  component: ApiKeysPage,
  loader: async () => {
    const apiKeys = await getApiKeysAction();

    return { apiKeys };
  },

  head: () => ({
    meta: [
      {
        title: title("API Keys"),
      },
    ],
  }),
});

function ApiKeysPage() {
  const [isDeletingApiKey, setIsDeletingApiKey] = useState<string | null>(null);
  const router = useRouter();
  const { apiKeys } = Route.useLoaderData();

  const handleDeleteApiKey = async (apiKeyId: string) => {
    setIsDeletingApiKey(apiKeyId);

    try {
      await deleteApiKeyAction({ data: { apiKeyId } });
      await router.invalidate();

      toast.success("API key deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete API key",
      );
    } finally {
      setIsDeletingApiKey(null);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-12">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 pb-2 md:pb-0">
              <Key />
              API Keys
            </CardTitle>
            <CardDescription className="mt-1">
              Create and manage API keys for programmatic access
            </CardDescription>
          </div>
          <ApiKeyCreationModal />
        </CardHeader>
        <CardContent className="p-0">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No API keys created</p>
              <p className="text-sm text-muted-foreground">
                Create an API key to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 py-4">Name</TableHead>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium pl-4">
                      {apiKey.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {apiKey.keyId}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(apiKey.createdAt)}</TableCell>
                    <TableCell className="text-right pr-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeletingApiKey === apiKey.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key?
                              <br />
                              <Badge variant="secondary" className="mt-2">
                                {apiKey.keyId}
                              </Badge>
                              <br />
                              <br />
                              This action cannot be undone and any applications
                              using this key will lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
