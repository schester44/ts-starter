import { workflow, otelPlugin } from "pg-workflows";
import { z } from "zod";

/**
 * Traced workflow factory — all workflows created with this emit OTel spans:
 *
 *   pg_workflows.workflow.run   — one span per execution (including resumes)
 *   pg_workflows.step.run       — one span per step.run()
 *   pg_workflows.step.waitFor   — one span per step.waitFor()
 *   pg_workflows.step.delay     — one span per step.delay()
 *
 */
const tracedWorkflow = workflow.use(otelPlugin());

/**
 * Example workflow ref — the lightweight handle used to start this workflow.
 *
 * Import this from the web app or anywhere you need to start/manage runs.
 * It carries only the workflow ID and input schema — no handler code.
 *
 *   import { exampleWorkflow } from "@__APP_NAME__/workflows/workflows/example";
 *
 *   const client = getWorkflowClient();
 *   const run = await client.startWorkflow(exampleWorkflow, { name: "World" });
 */
export const exampleWorkflow = tracedWorkflow.ref("example-workflow", {
  inputSchema: z.object({
    name: z.string(),
  }),
});

/**
 * Example Workflow Definition
 *
 * A minimal workflow that demonstrates the three core primitives:
 *
 *   step.run()     — Execute a function exactly once, even across retries.
 *   step.delay()   — Pause the workflow for a duration. Zero resources consumed.
 *   step.waitFor() — Pause until an external event arrives (or timeout).
 *
 * To resume after the waitFor step:
 *
 *   await client.triggerEvent({
 *     runId: run.id,
 *     eventName: "approval",
 *     data: { approvedBy: "admin" },
 *   });
 */
export const exampleWorkflowDef = exampleWorkflow(
  async ({ step, input, logger }) => {
    // Step 1: Run a durable step — result is persisted, never re-executed on retry
    const greeting = await step.run("greet", async () => {
      logger.log(`Hello, ${input.name}!`);

      return { message: `Hello, ${input.name}!` };
    });

    // Step 2: Pause for 5 seconds — workflow sleeps, no resources consumed
    await step.delay("short-delay", "5 seconds");

    // Step 3: Run another durable step
    await step.run("follow-up", async () => {
      logger.log(`Following up on: ${greeting.message}`);

      return { followedUp: true };
    });

    // Step 4: Wait for an external event (or timeout after 1 hour)
    const approval = await step.waitFor("await-approval", {
      eventName: "approval",
      timeout: 60 * 60 * 1000, // 1 hour
    });

    // Step 5: Final step based on whether the event arrived
    const approved = !!approval;

    await step.run("complete", async () => {
      logger.log(approved ? "Workflow approved!" : "Workflow timed out.");

      return { approved };
    });

    return { greeting: greeting.message, approved };
  },
);
