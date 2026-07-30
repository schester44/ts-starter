import "@__APP_NAME__/observe/instrument";
import { exampleQueue, webhook } from "@__APP_NAME__/queues";
import { queues } from "@__APP_NAME__/queues/queues";
import { createWorkflowEngine } from "@__APP_NAME__/workflows/engine";
import { logger } from "./lib/logger";
import { handleExample } from "./handlers/example";
import { handleSendWebhookEvent } from "./handlers/send-webhook-event";
import { exampleWorkflowDef } from "@__APP_NAME__/workflows/workflows/example";

async function startWorker() {
  logger.info({ msg: "Starting worker..." });

  try {
    queues.setLogger(logger);
    await queues.start();

    await exampleQueue.work(handleExample);
    await webhook.work(handleSendWebhookEvent);

    logger.info({ msg: "pg-boss queues started." });

    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }

    const workflowEngine = createWorkflowEngine(DATABASE_URL, [
      exampleWorkflowDef,
    ]);

    await workflowEngine.start();

    logger.info({ msg: "Workflow engine started." });

    async function shutdown(signal: string) {
      logger.info({ msg: `Received ${signal}, shutting down gracefully...` });
      await Promise.allSettled([queues.stop(), workflowEngine.stop()]);
      process.exit(0);
    }

    process.on("uncaughtException", async (error) => {
      logger.error({ msg: "Uncaught Exception", error });
      await Promise.allSettled([queues.stop(), workflowEngine.stop()]);
      process.exit(1);
    });

    process.on("unhandledRejection", async (reason) => {
      logger.error({ msg: "Unhandled Rejection", reason });
      await Promise.allSettled([queues.stop(), workflowEngine.stop()]);
      process.exit(1);
    });

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

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
