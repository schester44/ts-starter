import {
  AuditLogActionType,
  AuditLogActorType,
  AuditLogEntityType,
} from "@__APP_NAME__/db/generated/prisma/enums";
import z from "zod";

export const auditEntryActorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(AuditLogActorType.USER),
    id: z.string(),
    name: z.string(),
  }),
  z.object({
    type: z.literal(AuditLogActorType.SYSTEM),
  }),
  z.object({
    type: z.literal(AuditLogActorType.API_KEY),
    id: z.string(),
  }),
]);

export const logAuditEntryInputSchema = z.object({
  organizationId: z.string(),
  action: z.enum(AuditLogActionType),

  // Primary entity
  entityType: z.enum(AuditLogEntityType),
  entityId: z.string(),

  // Actor
  actor: auditEntryActorSchema,

  // Related entities
  relatedEntities: z
    .array(
      z.object({
        entityType: z.enum(AuditLogEntityType),
        entityId: z.string(),
      }),
    )
    .optional(),

  // Action-specific metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.date().optional(),
});

export type AuditEntryActor = z.infer<typeof auditEntryActorSchema>;
export type LogAuditEntryInput = z.infer<typeof logAuditEntryInputSchema>;
