import { defineQueue } from "../../define";
import z from "zod";

const baseWebhookSchema = z.object({
  idempotencyKey: z.string(),
  organizationId: z.uuid(),
  resourceId: z.uuid(),
});

/**
 * Define your webhook event schemas here.
 *
 * Each event type should have its own data schema extending the base.
 * Example events are provided — replace with your own domain events.
 */
const resourceCreatedDataSchema = z.object({
  resourceType: z.string(),
  metadata: z.record(z.string(), z.json()).optional(),
});

const resourceUpdatedDataSchema = z.object({
  resourceType: z.string(),
  changes: z.record(z.string(), z.json()).optional(),
  metadata: z.record(z.string(), z.json()).optional(),
});

export const webhookPayload = z.discriminatedUnion("event", [
  baseWebhookSchema.extend({
    event: z.literal("resource.created"),
    data: resourceCreatedDataSchema,
  }),
  baseWebhookSchema.extend({
    event: z.literal("resource.updated"),
    data: resourceUpdatedDataSchema,
  }),
]);

export type WebhookPayload = z.infer<typeof webhookPayload>;

export const webhook = defineQueue({
  name: "webhook",
  schema: webhookPayload,
  sendOptions: {
    retryLimit: 5,
    retryDelay: 60, // 1 minute
    retryBackoff: true, // exponential backoff
  },
});
