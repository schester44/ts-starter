import { createServerFn } from "@tanstack/react-start";
import { db } from "@__APP_NAME__/db";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";
import z from "zod";

const schema = z.object({
  limit: z.number().min(1).max(100).default(50),
});

export const getCompletedJobsAction = createServerFn({ method: "GET" })
  .middleware([actionTracingMiddleware, actionAuth])
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const jobs = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        state: string;
        created_on: Date;
        started_on: Date | null;
        completed_on: Date | null;
        retry_count: number;
        retry_limit: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output: any;
      }>
    >`
      SELECT
        id,
        name,
        state,
        created_on,
        started_on,
        completed_on,
        retry_count,
        retry_limit,
        data,
        output
      FROM pgboss.job
      WHERE state = 'completed'
        AND name != '__pgboss__send-it'
      ORDER BY completed_on DESC
      LIMIT ${data.limit}
    `;

    return jobs;
  });
