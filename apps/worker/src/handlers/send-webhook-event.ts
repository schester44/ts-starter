import crypto from "node:crypto";
import type { Job, WebhookPayload } from "@__APP_NAME__/queues";
import { decryptSecret } from "@/lib/webhooks";
import { logger } from "@/lib/logger";
import { db } from "@__APP_NAME__/db";

type Payload = {
  event: WebhookPayload["event"];
  data: Record<string, unknown>;
};

async function sendEvent(
  endpoint: string,
  payload: Payload,
  signingSecret: Buffer,
) {
  const start = Date.now();

  logger.info({
    msg: `Sending webhook`,
    webhook: {
      endpoint,
      event: payload.event,
    },
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(payload);

  // Create signature: HMAC-SHA256(timestamp.body, secret)
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(signedPayload)
    .digest("hex");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
    body,
  });

  const latency = Date.now() - start;

  logger.info({
    msg: `Webhook response`,
    webhook: {
      endpoint,
      event: payload.event,
      http_code: response.status,
      latency_ms: latency,
    },
  });

  return {
    httpCode: response.status,
    responseBody: await response.text(),
    latencyMs: latency,
  };
}

export async function handleSendWebhookEvent(
  job: Job<WebhookPayload>,
) {
  const { organizationId, idempotencyKey } = job.data;

  const endpoints = await db.webhookEndpoint.findMany({
    where: {
      organizationId,
    },
  });

  if (!endpoints.length) {
    logger.debug({
      msg: `No webhook endpoints found for org ${organizationId}`,
      organizationId,
    });

    return;
  }

  const webhookEvent = await db.webhookEvent.upsert({
    where: {
      organizationId_idempotencyKey: {
        organizationId,
        idempotencyKey,
      },
    },
    create: {
      organizationId,
      idempotencyKey,
      topic: job.data.event,
      resourceId: job.data.resourceId,
      requestBody: job.data.data as object,
    },
    update: {},
  });

  const existingAttempts = await db.webhookAttempt.findMany({
    where: { eventId: webhookEvent.id },
  });

  // Find endpoints that already have successful attempts — don't retry these
  const successfulEndpointIds = new Set(
    existingAttempts
      .filter((attempt) => attempt.status === "SUCCESS")
      .map((attempt) => attempt.endpointId),
  );

  // Only process endpoints that haven't succeeded yet
  const endpointsToProcess = endpoints.filter(
    (endpoint) => !successfulEndpointIds.has(endpoint.id),
  );

  if (endpointsToProcess.length === 0) {
    logger.debug({
      msg: `All webhook endpoints already succeeded for event ${webhookEvent.id}`,
      eventId: webhookEvent.id,
    });

    return;
  }

  logger.info({
    msg: `Processing ${endpointsToProcess.length} webhook endpoints (${successfulEndpointIds.size} already succeeded)`,
    webhook: {
      event_id: webhookEvent.id,
      organization_id: organizationId,
      topic: job.data.event,
      resource_id: job.data.resourceId,
    },
    retryCount: job.retryCount,
  });

  const results = await Promise.allSettled(
    endpointsToProcess.map(async (endpoint) => {
      const attempt = await db.webhookAttempt.create({
        data: {
          eventId: webhookEvent.id,
          endpointId: endpoint.id,
          retryNum: job.retryCount,
          status: "PENDING",
        },
      });

      try {
        const signingSecret = decryptSecret(
          Buffer.from(endpoint.signingSecretCipherText),
          Buffer.from(endpoint.signingSecretNonce),
        );

        const { httpCode, latencyMs } = await sendEvent(
          endpoint.url,
          {
            event: job.data.event,
            data: job.data.data,
          },
          signingSecret,
        );

        const isSuccess = httpCode >= 200 && httpCode < 300;

        await db.webhookAttempt.update({
          where: {
            id: attempt.id,
          },
          data: {
            status: isSuccess ? "SUCCESS" : "FAILED",
            httpCode,
            latencyMs,
          },
        });

        return {
          endpoint: { url: endpoint.url },
          httpCode,
          isSuccess,
        };
      } catch (error) {
        const logLevel = job.retryCount === job.retryLimit ? "error" : "warn";

        logger[logLevel]({
          msg: `Error sending webhook to ${endpoint.url}`,
          error,
          endpointId: endpoint.id,
          eventId: webhookEvent.id,
        });

        await db.webhookAttempt.update({
          where: {
            id: attempt.id,
          },
          data: {
            status: "FAILED",
            httpCode: null,
            latencyMs: null,
          },
        });

        return {
          endpoint: { url: endpoint.url },
          httpCode: null,
          isSuccess: false,
        };
      }
    }),
  );

  // Check if any endpoints failed
  const failedResults = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((result) => !result.isSuccess);

  if (failedResults.length > 0) {
    const failureMessage = `${failedResults.length} webhook endpoint(s) failed: ${failedResults
      .map((r) => `${r.endpoint.url} (${r.httpCode ?? "network error"})`)
      .join(", ")}`;

    logger.warn({
      msg: failureMessage,
      eventId: webhookEvent.id,
      retryCount: job.retryCount,
      retryLimit: job.retryLimit,
      results: failedResults,
    });

    // Throw error to trigger pg-boss retry
    throw new Error(failureMessage);
  }
}
