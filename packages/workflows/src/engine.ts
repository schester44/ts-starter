/**
 * Workflow engine factory.
 *
 * Pure infrastructure — no workflow definitions live here.
 * Import workflow handlers directly and register them below.
 */
import { WorkflowEngine } from "pg-workflows";
import type { WorkflowDefinition } from "pg-workflows";

export function createWorkflowEngine(
  connectionString: string,
  workflows: WorkflowDefinition[],
): WorkflowEngine {
  return new WorkflowEngine({
    connectionString,
    workflows,
  });
}

export { WorkflowEngine };
