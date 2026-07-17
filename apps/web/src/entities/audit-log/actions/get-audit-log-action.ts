import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { AuditLogActionType } from "@__APP_NAME__/db/generated/prisma/enums";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const DEFAULT_LIMIT = 25;

const searchSchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(DEFAULT_LIMIT),
  action: z.enum(AuditLogActionType).optional(),
});

export type AuditLogSearchParams = z.infer<typeof searchSchema>;

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(searchSchema)
  .handler(async ({ context: { activeOrganizationId }, data }) => {
    const where = {
      organizationId: activeOrganizationId,
      ...(data.action ? { action: data.action } : {}),
    };

    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: data.offset,
        take: data.limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      offset: data.offset,
      limit: data.limit,
      hasMore: data.offset + data.limit < total,
    };
  });
