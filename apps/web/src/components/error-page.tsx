import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorPage({ message }: { message: string }) {
  function handleRefresh() {
    window.location.reload();
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
            Oops! Something
            <br />
            <span className="text-primary">Went Wrong</span>
          </h1>
        </div>

        <div className="max-w-md mx-auto text-left rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-mono text-sm">Error: {message}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button size="lg" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
