import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import type { Prisma } from "@__APP_NAME__/db";
import {
  AuditLogActionType,
  AuditLogActorType,
  AuditLogEntityType,
} from "@__APP_NAME__/db/generated/prisma/enums";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const getAuditLogSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().catch(50),
  offset: z.coerce.number().min(0).optional().catch(0),
  entityType: z.enum(AuditLogEntityType).optional(),
  action: z.enum(AuditLogActionType).optional(),
  actorType: z.enum(AuditLogActorType).optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
});

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(getAuditLogSchema)
  .handler(async ({ context: { activeOrganizationId }, data }) => {
    const limit = data.limit || 50;
    const offset = data.offset || 0;

    const where: Prisma.AuditLogWhereInput = {
      organizationId: activeOrganizationId,
      ...(data.entityType && { entityType: data.entityType }),
      ...(data.action && { action: data.action }),
      ...(data.actorType && { actorType: data.actorType }),
      ...(data.actorId && { actorId: data.actorId }),
      ...(data.entityId && {
        OR: [
          { entityId: data.entityId },
          { relatedEntities: { some: { entityId: data.entityId } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    const hasMore = offset + limit < total;

    return {
      items,
      pagination: {
        limit,
        offset,
        total,
        count: items.length,
        has_more: hasMore,
        next_offset: hasMore ? offset + limit : null,
      },
    };
  });
