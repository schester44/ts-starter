import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/table-pagination";
import { getAuditLog } from "@/entities/audit-log/actions/get-audit-log-action";
import { formatDateTime, toHumanReadable } from "@/lib/formatting";
import { title } from "@/lib/meta";
import type { AuditLogActionType as AuditLogActionTypeEnum } from "@__APP_NAME__/db/generated/prisma/enums";
import { AuditLogActionType } from "@__APP_NAME__/db/generated/prisma/enums";
import { useNavigate } from "@tanstack/react-router";
import { ClipboardList, User, Bot, Key } from "lucide-react";
import z from "zod";

const searchSchema = z.object({
  offset: z.number().int().min(0).optional(),
  action: z.enum(AuditLogActionType).optional(),
});

export const Route = createFileRoute("/_authed/settings/audit-log")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: title("Audit Log") }] }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getAuditLog({
      data: {
        offset: deps.offset ?? 0,
        limit: 25,
        action: deps.action,
      },
    }),
  component: AuditLogPage,
});

const actorTypeIcons = {
  USER: User,
  SYSTEM: Bot,
  API_KEY: Key,
} as const;

const actionColors: Partial<
  Record<string, "default" | "secondary" | "destructive" | "outline">
> = {
  MEMBER_INVITED: "default",
  MEMBER_REMOVED: "destructive",
  MEMBER_ROLE_UPDATED: "secondary",
  INVITATION_CANCELLED: "outline",
  SETTINGS_UPDATED: "secondary",
};

function AuditLogPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const handleActionFilter = (value: string) => {
    navigate({
      to: "/settings/audit-log",
      search: {
        action:
          value === "all"
            ? undefined
            : (value as AuditLogActionTypeEnum),
        offset: undefined,
      },
    });
  };

  return (
    <div className="p-4 md:p-6 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all actions performed in your organization
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={search.action ?? "all"}
          onValueChange={handleActionFilter}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.values(AuditLogActionType).map((action) => (
              <SelectItem key={action} value={action}>
                {toHumanReadable(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 py-4">Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8" />
                    <span>No audit log entries found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map(
                (entry: {
                  id: string;
                  action: string;
                  actorType: string;
                  actorName: string | null;
                  entityType: string;
                  metadata: unknown;
                  occurredAt: string | Date;
                }) => {
                  const ActorIcon =
                    actorTypeIcons[
                      entry.actorType as keyof typeof actorTypeIcons
                    ] ?? User;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-4 py-4">
                        <Badge
                          variant={actionColors[entry.action] ?? "secondary"}
                        >
                          {toHumanReadable(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActorIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {entry.actorName ??
                              toHumanReadable(entry.actorType)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <MetadataSummary
                          action={entry.action}
                          metadata={
                            entry.metadata as Record<string, unknown> | null
                          }
                          entityType={entry.entityType}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(new Date(entry.occurredAt))}
                      </TableCell>
                    </TableRow>
                  );
                },
              )
            )}
          </TableBody>
        </Table>

        {data && data.total > 0 && (
          <TablePagination
            to="/settings/audit-log"
            currentOffset={data.offset}
            limit={data.limit}
            total={data.total}
            hasMore={data.hasMore}
          />
        )}
      </div>
    </div>
  );
}

function MetadataSummary({
  action,
  metadata,
  entityType,
}: {
  action: string;
  metadata: Record<string, unknown> | null;
  entityType: string;
}) {
  if (!metadata) {
    return (
      <span className="text-sm text-muted-foreground">
        {toHumanReadable(entityType)}
      </span>
    );
  }

  const parts: string[] = [];

  if (metadata.email) parts.push(String(metadata.email));
  if (metadata.role) parts.push(`role: ${metadata.role}`);

  if (parts.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {toHumanReadable(entityType)}
      </span>
    );
  }

  return <span className="text-sm text-muted-foreground">{parts.join(" · ")}</span>;
}
