import { exampleQueue, webhook, queueProvider } from "@__APP_NAME__/queues";
import { logger } from "./lib/logger";
import { handleExample } from "./handlers/example";
import { handleSendWebhookEvent } from "./handlers/send-webhook-event";

async function startWorker() {
  logger.info({ msg: "Starting worker..." });

  try {
    queueProvider.setLogger(logger);
    await queueProvider.start();

    // Register queue handlers here
    await queueProvider.work(exampleQueue, handleExample);
    await queueProvider.work(webhook, handleSendWebhookEvent);

    // --- Graceful shutdown ---

    process.on("uncaughtException", async (error) => {
      logger.error({ msg: "Uncaught Exception", error });
      await queueProvider.stop();
      process.exit(1);
    });

    process.on("unhandledRejection", async (reason) => {
      logger.error({ msg: "Unhandled Rejection", reason });
      await queueProvider.stop();
      process.exit(1);
    });

    process.on("SIGTERM", async () => {
      logger.info({ msg: "Received SIGTERM, shutting down gracefully..." });
      await queueProvider.stop();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info({ msg: "Received SIGINT, shutting down gracefully..." });
      await queueProvider.stop();
      process.exit(0);
    });

    logger.info({ msg: "Worker started successfully." });
  } catch (error) {
    logger.error({ msg: "Error starting worker", error });
    process.exit(1);
  }
}

startWorker().catch((error) => {
  logger.error({ msg: "Fatal error starting worker", error });
  process.exit(1);
});
