import { createServerFn } from "@tanstack/react-start";
import { db } from "@__APP_NAME__/db";
import { actionAuth } from "@/middleware/auth";
import { actionTracingMiddleware } from "@/middleware/tracing";

export const getJobStatsAction = createServerFn({ method: "GET" })
  .middleware([actionTracingMiddleware, actionAuth])
  .handler(async () => {
    const stats = await db.$queryRaw<
      Array<{
        state: string;
        count: bigint;
      }>
    >`
      SELECT
        state,
        COUNT(*) as count
      FROM pgboss.job
      WHERE name != '__pgboss__send-it'
      GROUP BY state
      ORDER BY state
    `;

    return stats.map((stat) => ({
      state: stat.state,
      count: Number(stat.count),
    }));
  });
