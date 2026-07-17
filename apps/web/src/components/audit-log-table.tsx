import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserMinus,
  UserCog,
  Settings,
  Key,
  Ban,
  XCircle,
  FileText,
} from "lucide-react";
import type {
  AuditLogActionType,
  AuditLogEntityType,
} from "@__APP_NAME__/db/generated/prisma/enums";
import { toHumanReadable } from "@/lib/formatting";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  metadata: unknown;
  occurredAt: string | Date;
};

interface AuditLogTableProps {
  auditLogs: AuditLogItem[];
  onActorClick?: (actorId: string, actorName: string) => void;
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(0, 8) : id;
}

function getActionIcon(action: string) {
  switch (action as AuditLogActionType) {
    case "MEMBER_INVITED":
      return <UserPlus className="h-4 w-4" />;
    case "MEMBER_REMOVED":
      return <UserMinus className="h-4 w-4" />;
    case "MEMBER_ROLE_UPDATED":
      return <UserCog className="h-4 w-4" />;
    case "INVITATION_CANCELLED":
      return <XCircle className="h-4 w-4" />;
    case "SETTINGS_UPDATED":
      return <Settings className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function camelCaseToHumanReadable(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatMetadata(
  action: string,
  metadata: Record<string, unknown> | null,
): React.ReactNode {
  if (!metadata) return null;

  switch (action as AuditLogActionType) {
    case "MEMBER_INVITED":
      return (
        <div className="space-y-1 text-sm">
          {typeof metadata.email === "string" && (
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{metadata.email}</span>
            </div>
          )}
          {typeof metadata.role === "string" && (
            <div>
              <span className="text-muted-foreground">Role:</span>{" "}
              <span className="font-medium">{metadata.role}</span>
            </div>
          )}
        </div>
      );

    case "MEMBER_ROLE_UPDATED":
    case "SETTINGS_UPDATED": {
      const changes = metadata.changes as
        | Record<string, { before: unknown; after: unknown }>
        | undefined;

      if (changes) {
        return (
          <div className="space-y-3">
            {Object.entries(changes).map(([field, { before, after }]) => (
              <div key={field} className="flex items-center gap-3 text-sm">
                <span className="font-medium min-w-[120px]">
                  {camelCaseToHumanReadable(field)}:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">
                    {String(before)}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono font-medium">
                    {String(after)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      }

      break;
    }
  }

  // Generic fallback
  return (
    <div className="space-y-1 text-sm">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key}>
          <span className="text-muted-foreground">
            {camelCaseToHumanReadable(key)}:
          </span>{" "}
          <span className="font-medium">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuditLogTable({ auditLogs, onActorClick }: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  if (auditLogs.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-8 text-muted-foreground"
            >
              No audit log entries found
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((log) => {
          const isExpanded = expandedRows.has(log.id);
          const hasDetails = !!log.metadata;

          return (
            <>
              <TableRow key={log.id} className="group">
                <TableCell>
                  {hasDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(log.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <span className="font-medium">
                      {toHumanReadable(log.action)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-2 py-1">
                      {toHumanReadable(log.entityType)}
                    </Badge>
                    <span className="text-sm font-mono">
                      #{shortId(log.entityId)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {log.actorType === "SYSTEM" ? (
                      <span className="text-muted-foreground">System</span>
                    ) : log.actorName ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 hover:underline text-left"
                        onClick={() =>
                          onActorClick?.(
                            log.actorId || "",
                            log.actorName || "",
                          )
                        }
                      >
                        <Avatar className="w-5 h-5 rounded">
                          <AvatarFallback className="text-[10px]">
                            {log.actorName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {log.actorName}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">
                        {toHumanReadable(log.actorType)} (
                        {shortId(log.actorId || "unknown")})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="text-sm text-muted-foreground"
                    title={new Date(log.occurredAt).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(log.occurredAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow key={`${log.id}-expanded`}>
                  <TableCell colSpan={5} className="bg-muted/30 py-4">
                    <div className="px-4">
                      {formatMetadata(
                        log.action,
                        log.metadata as Record<string, unknown>,
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
