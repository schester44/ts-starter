import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

interface TableSearchProps {
  to: string;
  placeholder?: string;
  currentSearch?: string;
}

export function TableSearch({
  to,
  placeholder = "Search...",
  currentSearch,
}: TableSearchProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebouncedCallback((term: string) => {
    startTransition(() => {
      navigate({
        to,
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          q: term || undefined,
          offset: undefined,
        }),
      });
    });
  }, 300);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  };

  return (
    <div className="relative max-w-md">
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className={isPending ? "opacity-50" : ""}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
}
