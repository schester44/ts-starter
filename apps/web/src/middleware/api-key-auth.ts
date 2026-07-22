import { db } from "@__APP_NAME__/db";
import { logger } from "@/lib/logger";
import { createMiddleware } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * API key authentication middleware for API routes.
 *
 * Validates API keys passed via the `Authorization: Bearer sk_...` header
 * or the `X-API-Key` header. Keys are expected to be in the format
 * `sk_<keyId>.<secret>` and are verified against hashed secrets stored
 * in the database using timing-safe comparison.
 *
 * On success, sets `apiKeyId` and `activeOrganizationId` in the context.
 */
export const apiKeyAuth = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const authorizationHeader = request.headers.get("authorization");
    const xApiKeyHeader = request.headers.get("x-api-key");

    const rawKey = authorizationHeader
      ? authorizationHeader.replace("Bearer ", "")
      : xApiKeyHeader;

    if (!rawKey) {
      logger.warn({
        msg: "API key auth failed - no key provided",
        url: request.url,
        method: request.method,
      });

      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [maybeId] = rawKey.split(".");
    const keyId = maybeId?.startsWith("sk_") ? maybeId : undefined;

    if (!keyId) {
      return Response.json({ error: "Malformed API key" }, { status: 401 });
    }

    const candidate = await db.apiKey.findFirst({ where: { keyId } });

    const ok =
      candidate &&
      timingSafeEqual(
        Buffer.from(candidate.hashedSecret, "hex"),
        Buffer.from(hashApiKey(rawKey), "hex"),
      );

    if (!ok) {
      logger.warn({
        msg: "API key auth failed - invalid key",
        keyId,
        url: request.url,
      });

      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    return next({
      context: {
        apiKeyId: candidate.id,
        activeOrganizationId: candidate.organizationId,
      },
    });
  },
);
