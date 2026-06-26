import { logger } from "@/lib/logger";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import { db } from "@__APP_NAME__/db";
import { createServerFn } from "@tanstack/react-start";
import { createHash, randomBytes } from "node:crypto";
import z from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

function generateApiKey(prefix: "sk_" = "sk_") {
  const keyId = randomBytes(9).toString("base64url");
  const secret = randomBytes(24).toString("base64url");
  const apiKey = `${prefix}${keyId}.${secret}`;

  return {
    apiKey,
    keyId: `${prefix}${keyId}`,
    secret,
    prefix,
  };
}

export const createApiKeyAction = createServerFn()
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(schema)
  .handler(async ({ data, context }) => {
    try {
      const key = generateApiKey();

      const apiKey = await db.apiKey.create({
        data: {
          name: data.name,
          organizationId: context.activeOrganizationId,
          keyId: key.keyId,
          hashedSecret: createHash("sha256").update(key.apiKey).digest("hex"),
        },
      });

      return {
        id: apiKey.id,
        keyId: apiKey.keyId,
        createdAt: apiKey.createdAt,
        apiKey: key.apiKey, // Only returned once during creation
      };
    } catch (error) {
      logger.error({ error });

      if (
        error instanceof Error &&
        error.message.includes("Unique constraint failed")
      ) {
        throw new Error(
          "An API key with this keyId already exists. Please try again.",
        );
      }

      throw new Error("Failed to create API key");
    }
  });
