import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/formatting";
import { Badge } from "@/components/ui/badge";
import { shortId } from "@/lib/short-id";

interface Job {
  id: string;
  name: string;
  state: string;
  created_on: Date;
  started_on: Date | null;
  completed_on: Date | null;
  retry_count: number;
  retry_limit: number;
}

interface CompletedJobsTableProps {
  jobs: Job[];
}

export function CompletedJobsTable({ jobs }: CompletedJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-card p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          Completed Jobs
        </h3>
        <div className="text-center text-muted-foreground py-8">
          No completed jobs found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6">
      <h3 className="text-lg font-medium text-foreground mb-4">
        Latest Completed Jobs
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Queue Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Retries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-sm">
                {shortId(job.id)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{job.name}</Badge>
              </TableCell>
              <TableCell>{formatDateTime(job.created_on)}</TableCell>
              <TableCell>
                {job.started_on ? formatDateTime(job.started_on) : "N/A"}
              </TableCell>
              <TableCell>
                {job.completed_on ? formatDateTime(job.completed_on) : "N/A"}
              </TableCell>
              <TableCell>
                {job.retry_count} / {job.retry_limit}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
