import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { createSecret, encryptSecret } from "@/lib/webhooks";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.url("Invalid URL format"),
});

export const createWebhookEndpointAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(schema)
  .handler(async ({ data, context }) => {
    const secret = createSecret();
    const { nonce, ct } = encryptSecret(secret);

    try {
      const webhookEndpoint = await db.webhookEndpoint.create({
        data: {
          name: data.name,
          url: data.url,
          organizationId: context.activeOrganizationId,
          signingSecretNonce: Uint8Array.from(nonce),
          signingSecretCipherText: ct,
        },
      });

      return {
        id: webhookEndpoint.id,
        url: webhookEndpoint.url,
        createdAt: webhookEndpoint.createdAt,
        secret: secret.toString("base64"),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint failed")
      ) {
        throw new Error(
          "A webhook endpoint with this URL already exists for your organization",
        );
      }

      throw new Error("Failed to create webhook endpoint");
    }
  });
