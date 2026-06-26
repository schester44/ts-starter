import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getCompletedJobsAction } from "@/entities/jobs/actions/get-completed-jobs-action";
import { getFailedJobsAction } from "@/entities/jobs/actions/get-failed-jobs-action";
import { getJobStatsAction } from "@/entities/jobs/actions/get-job-stats-action";
import { CompletedJobsTable } from "@/components/completed-jobs-table";
import { FailedJobsTable } from "@/components/failed-jobs-table";
import { JobStatsCards } from "@/components/job-stats-cards";
import { useEffect } from "react";
import { title } from "@/lib/meta";

export const Route = createFileRoute("/_authed/developers/jobs")({
  component: JobsPage,
  loader: async () => {
    const [completedJobs, failedJobs, stats] = await Promise.all([
      getCompletedJobsAction({ data: { limit: 25 } }),
      getFailedJobsAction({ data: { limit: 50 } }),
      getJobStatsAction(),
    ]);

    return {
      completedJobs,
      failedJobs,
      stats,
    };
  },

  head: () => ({
    meta: [
      {
        title: title("Background Jobs"),
      },
    ],
  }),
});

function JobsPage() {
  const { completedJobs, failedJobs, stats } = Route.useLoaderData();
  const router = useRouter();

  useEffect(() => {
    // Poll every 3 seconds
    const interval = setInterval(() => {
      router.invalidate();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="p-6 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Background Jobs</h1>
      </div>

      <JobStatsCards stats={stats} />
      <FailedJobsTable jobs={failedJobs} />
      <CompletedJobsTable jobs={completedJobs} />
    </div>
  );
}
