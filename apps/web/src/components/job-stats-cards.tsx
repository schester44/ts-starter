import { toHumanReadable } from "@/lib/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface JobStatsCardsProps {
  stats: Array<{
    state: string;
    count: number;
  }>;
}

export function JobStatsCards({ stats }: JobStatsCardsProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Job Statistics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {stats.map(({ state, count }) => {
          return (
            <Card key={state}>
              <CardHeader>
                <CardTitle>{toHumanReadable(state)}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl">
                {count.toLocaleString()}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
