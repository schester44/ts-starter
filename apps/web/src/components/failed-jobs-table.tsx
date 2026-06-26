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
import { Button } from "@/components/ui/button";
import { shortId } from "@/lib/short-id";
import { AlertCircle, RotateCw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Job {
  id: string;
  name: string;
  state: string;
  created_on: Date;
  started_on: Date | null;
  completed_on: Date | null;
  retry_count: number;
  retry_limit: number;
  data: Record<string, unknown>;
  output: { stack: string; message: string } | null;
}

interface FailedJobsTableProps {
  jobs: Job[];
}

function JobErrorDetails({ job }: { job: Job }) {
  const [isOpen, setIsOpen] = useState(false);

  const errorMessage = job.output?.message || "No error message available";
  const errorStack = job.output?.stack;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-1" />
          {isOpen ? "Hide" : "Show"} Error
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded p-3 text-sm">
          <div className="font-medium text-muted-foreground mb-1">
            Error Message:
          </div>
          <div className="text-slate-700 dark:text-gray-300 mb-2">
            {errorMessage}
          </div>
          {!!errorStack && (
            <>
              <div className="font-medium text-slate-900 dark:text-gray-200 mb-1">
                Stack Trace:
              </div>
              <pre className="text-slate-600 dark:text-gray-400 text-xs overflow-x-auto whitespace-pre-wrap">
                {errorStack}
              </pre>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FailedJobsTable({ jobs }: FailedJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No failed jobs found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failed Jobs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 py-4">Job ID</TableHead>
              <TableHead>Queue Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Failed At</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Error</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono pl-4 py-4">
                  {shortId(job.id)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{job.name}</Badge>
                </TableCell>
                <TableCell>{formatDateTime(job.created_on)}</TableCell>
                <TableCell>
                  {job.completed_on ? formatDateTime(job.completed_on) : "N/A"}
                </TableCell>
                <TableCell>
                  {job.retry_count} / {job.retry_limit}
                </TableCell>
                <TableCell>
                  <JobErrorDetails job={job} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="Retry functionality coming soon"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
