import { WorkflowClient } from "pg-workflows/client";

const globalForWorkflows = globalThis as unknown as {
  workflowClient: WorkflowClient | undefined;
};

export function getWorkflowClient(): WorkflowClient {
  if (globalForWorkflows.workflowClient) {
    return globalForWorkflows.workflowClient;
  }

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for workflow client");
  }

  const client = new WorkflowClient({
    connectionString: DATABASE_URL,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForWorkflows.workflowClient = client;
  }

  return client;
}

export { WorkflowClient } from "pg-workflows/client";
export { WorkflowStatus } from "pg-workflows/client";
