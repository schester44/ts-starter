import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AuditLogActionType,
  AuditLogActorType,
  AuditLogEntityType,
} from "@__APP_NAME__/db/generated/prisma/enums";
import type {
  AuditLogActionType as AuditLogActionTypeEnum,
  AuditLogActorType as AuditLogActorTypeEnum,
  AuditLogEntityType as AuditLogEntityTypeEnum,
} from "@__APP_NAME__/db/generated/prisma/enums";
import { getAuditLog } from "@/entities/audit-log/actions/get-audit-log-action";
import { AuditLogTable } from "@/components/audit-log-table";
import { TablePagination } from "@/components/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { title } from "@/lib/meta";
import { toHumanReadable } from "@/lib/formatting";
import z from "zod";

const auditLogSearchSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().catch(50),
  offset: z.coerce.number().min(0).optional().catch(0),
  entityType: z.enum(AuditLogEntityType).optional(),
  action: z.enum(AuditLogActionType).optional(),
  actorType: z.enum(AuditLogActorType).optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
});

export const Route = createFileRoute("/_authed/audit-log")({
  validateSearch: auditLogSearchSchema,
  loaderDeps: ({ search }) => ({
    offset: search.offset,
    limit: search.limit,
    entityType: search.entityType,
    action: search.action,
    actorType: search.actorType,
    entityId: search.entityId,
    actorId: search.actorId,
  }),
  loader: ({ deps }) => getAuditLog({ data: deps }),
  head: () => ({
    meta: [{ title: title("Audit Log") }],
  }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const navigate = Route.useNavigate();
  const { entityType, action, actorType, entityId, actorId, actorName } =
    Route.useSearch();
  const data = Route.useLoaderData();
  const [entityIdInput, setEntityIdInput] = React.useState(entityId || "");

  React.useEffect(() => {
    setEntityIdInput(entityId || "");
  }, [entityId]);

  React.useEffect(() => {
    const trimmedInput = entityIdInput.trim();
    const currentEntityId = entityId || "";

    if (trimmedInput === currentEntityId) return;

    const timeoutId = setTimeout(() => {
      navigate({
        to: "/audit-log",
        search: (prev) => ({
          ...prev,
          entityId: trimmedInput || undefined,
          offset: 0,
        }),
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [entityIdInput, entityId, navigate]);

  const hasActiveFilters =
    !!(entityType || action || actorType || entityId) || !!actorId;

  const activeFilterCount = [
    entityType,
    action,
    actorType,
    entityId,
    actorId,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    navigate({
      to: "/audit-log",
      search: { limit: 50, offset: 0 },
    });
  };

  const clearFilter = (
    filterName:
      | "entityType"
      | "action"
      | "actorType"
      | "entityId"
      | "actorId",
  ) => {
    navigate({
      to: "/audit-log",
      search: (prev) => ({
        ...prev,
        [filterName]: undefined,
        ...(filterName === "actorId" ? { actorName: undefined } : {}),
        offset: 0,
      }),
    });
  };

  const shortId = (id: string) => (id.length > 8 ? id.slice(0, 8) : id);

  return (
    <div className="p-4 md:p-6 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit Log</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Entity Type Filter */}
        <Select
          value={entityType || "all"}
          onValueChange={(value) => {
            navigate({
              to: "/audit-log",
              search: (prev) => ({
                ...prev,
                entityType:
                  value === "all"
                    ? undefined
                    : (value as AuditLogEntityTypeEnum),
                offset: 0,
              }),
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {Object.values(AuditLogEntityType).map((type) => (
              <SelectItem key={type} value={type}>
                {toHumanReadable(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Type Filter */}
        <Select
          value={action || "all"}
          onValueChange={(value) => {
            navigate({
              to: "/audit-log",
              search: (prev) => ({
                ...prev,
                action:
                  value === "all"
                    ? undefined
                    : (value as AuditLogActionTypeEnum),
                offset: 0,
              }),
            });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.values(AuditLogActionType).map((type) => (
              <SelectItem key={type} value={type}>
                {toHumanReadable(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actor Type Filter */}
        <Select
          value={actorType || "all"}
          onValueChange={(value) => {
            navigate({
              to: "/audit-log",
              search: (prev) => ({
                ...prev,
                actorType:
                  value === "all"
                    ? undefined
                    : (value as AuditLogActorTypeEnum),
                offset: 0,
              }),
            });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Actors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            {Object.values(AuditLogActorType).map((type) => (
              <SelectItem key={type} value={type}>
                {toHumanReadable(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entity ID Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Entity ID"
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            className="w-[220px] pl-9"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
            Clear All
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {actorId && (
            <Badge variant="secondary" className="gap-2">
              Actor: {actorName || shortId(actorId)}
              <button
                onClick={() => clearFilter("actorId")}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {entityId && (
            <Badge variant="secondary" className="gap-2">
              Entity: {shortId(entityId)}
              <button
                onClick={() => clearFilter("entityId")}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {entityType && (
            <Badge variant="secondary" className="gap-2">
              {toHumanReadable(entityType)}
              <button
                onClick={() => clearFilter("entityType")}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {action && (
            <Badge variant="secondary" className="gap-2">
              {toHumanReadable(action)}
              <button
                onClick={() => clearFilter("action")}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {actorType && (
            <Badge variant="secondary" className="gap-2">
              {toHumanReadable(actorType)}
              <button
                onClick={() => clearFilter("actorType")}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="border-2 rounded-lg bg-card">
        {data && (
          <>
            <AuditLogTable
              auditLogs={data.items}
              onActorClick={(id, name) => {
                navigate({
                  to: "/audit-log",
                  search: {
                    actorId: id,
                    actorName: name,
                    offset: 0,
                  },
                });
              }}
            />

            {data.pagination.total > 0 && (
              <TablePagination
                to="/audit-log"
                currentOffset={data.pagination.offset}
                limit={data.pagination.limit}
                total={data.pagination.total}
                hasMore={data.pagination.has_more}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
