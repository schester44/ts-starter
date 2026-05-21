import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

interface TablePaginationProps {
  to: string;
  currentOffset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function TablePagination({
  to,
  currentOffset,
  limit,
  total,
  hasMore,
}: TablePaginationProps) {
  const navigate = useNavigate();

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - limit);

    navigate({
      to,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        offset: newOffset === 0 ? undefined : newOffset,
      }),
    });
  };

  const handleNext = () => {
    if (hasMore) {
      const newOffset = currentOffset + limit;

      navigate({
        to,
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          offset: newOffset,
        }),
      });
    }
  };

  return (
    <div className="px-6 py-4 border-t flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {currentOffset + 1} to {Math.min(currentOffset + limit, total)}{" "}
        of {total} results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!currentOffset}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={handleNext} disabled={!hasMore}>
          Next
        </Button>
      </div>
    </div>
  );
}
