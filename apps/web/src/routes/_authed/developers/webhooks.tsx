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
import { Webhook, Trash2 } from "lucide-react";
import { WebhookCreationModal } from "@/components/webhook-creation-modal";
import { deleteWebhookEndpointAction } from "@/entities/webhooks/actions/delete-webhook-endpoint-action";
import { getWebhooks } from "@/entities/webhooks/actions/get-webhooks-action";
import { title } from "@/lib/meta";
import { formatDateTime } from "@/lib/formatting";

export const Route = createFileRoute("/_authed/developers/webhooks")({
  component: WebhooksPage,
  loader: async () => {
    const webhooks = await getWebhooks();

    return { webhooks };
  },

  head: () => ({
    meta: [
      {
        title: title("Webhook Endpoints"),
      },
    ],
  }),
});

function WebhooksPage() {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();
  const { webhooks } = Route.useLoaderData();

  const handleDeleteWebhook = async (webhookId: string) => {
    setIsDeleting(webhookId);

    try {
      await deleteWebhookEndpointAction({ data: { webhookId } });
      await router.invalidate();

      toast.success("Webhook endpoint deleted");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete webhook endpoint",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-12">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 pb-2 md:pb-0">
              <Webhook className="h-5 w-5" />
              Webhook Endpoints
            </CardTitle>
            <CardDescription>
              Configure endpoints to receive real-time event notifications
            </CardDescription>
          </div>
          <WebhookCreationModal />
        </CardHeader>
        <CardContent className="p-0">
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground mb-4">
                No webhook endpoints configured
              </p>
              <p className="text-sm text-muted-foreground">
                Add an endpoint to start receiving event notifications
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 py-4">Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="pl-4">{webhook.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(webhook.createdAt)}</TableCell>
                    <TableCell className="text-right pr-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting === webhook.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Webhook Endpoint
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this webhook
                              endpoint?
                              <br />
                              <Badge variant="secondary" className="my-4">
                                {webhook.url}
                              </Badge>
                              <br />
                              This action cannot be undone and your application
                              will stop receiving webhook events at this
                              endpoint.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteWebhook(webhook.id)}
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
