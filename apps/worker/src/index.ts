import { exampleQueue, webhook } from "@__APP_NAME__/queues";
import { queues } from "@__APP_NAME__/queues/queues";
import { logger } from "./lib/logger";
import { handleExample } from "./handlers/example";
import { handleSendWebhookEvent } from "./handlers/send-webhook-event";

async function startWorker() {
  logger.info({ msg: "Starting pg-boss worker..." });

  try {
    queues.setLogger(logger);
    await queues.start();

    // Register queue handlers here
    await exampleQueue.work(handleExample);
    await webhook.work(handleSendWebhookEvent);

    // --- Graceful shutdown ---

    process.on("uncaughtException", async (error) => {
      logger.error({ msg: "Uncaught Exception", error });
      await queues.stop();
      process.exit(1);
    });

    process.on("unhandledRejection", async (reason) => {
      logger.error({ msg: "Unhandled Rejection", reason });
      await queues.stop();
      process.exit(1);
    });

    process.on("SIGTERM", async () => {
      logger.info({ msg: "Received SIGTERM, shutting down gracefully..." });
      await queues.stop();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info({ msg: "Received SIGINT, shutting down gracefully..." });
      await queues.stop();
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
