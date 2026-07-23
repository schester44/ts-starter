import { createHash, randomBytes } from "node:crypto";
import z from "zod";
import type { PrismaClient } from "@__APP_NAME__/db/generated/prisma/client";
import {
  AuditLogActionType,
  AuditLogActorType,
  AuditLogEntityType,
} from "@__APP_NAME__/db/generated/prisma/enums";
import { requestBody, response } from "@/lib/requests";
import { logAuditEntry } from "@/lib/audit-log";

const createApiKeyRequestSchema = z.object({
  organizationId: z.string().uuid(),
});

const createApiKeyResponseSchema = z.object({
  keyId: z.string(),
  apiKey: z.string(),
});

export function generateApiKey(prefix: "sk_" = "sk_") {
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

export async function createApiKeyHandler({
  request,
  db,
}: {
  request: Request;
  db: PrismaClient;
}) {
  const { organizationId } = await requestBody(
    request,
    createApiKeyRequestSchema,
  );

  const key = generateApiKey();

  const data = await db.$transaction(async (tx) => {
    const data = await tx.apiKey.create({
      data: {
        organizationId,
        keyId: key.keyId,
        hashedSecret: createHash("sha256").update(key.apiKey).digest("hex"),
        name: "Admin Created Key",
      },
    });

    await logAuditEntry(tx, {
      organizationId,
      action: AuditLogActionType.API_KEY_CREATED,
      entityType: AuditLogEntityType.API_KEY,
      entityId: data.id,
      actor: {
        type: AuditLogActorType.API_KEY,
        id: "admin-api-key",
      },
    });

    return data;
  });

  return response({
    data: {
      keyId: data.keyId,
      apiKey: key.apiKey,
    },
    schema: createApiKeyResponseSchema,
    status: 201,
  });
}
