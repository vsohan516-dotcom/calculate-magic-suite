import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryEntry } from "@/hooks/use-history";

interface StatsChartProps {
  entries: HistoryEntry[];
}

export function StatsChart({ entries }: StatsChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.category] = (counts[e.category] ?? 0) + 1;
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  if (data.length === 0) {
    return (
      <div className="glass-panel grid h-44 place-items-center p-6 text-sm text-muted-foreground">
        Run a few calculations to see your usage stats.
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Usage by mode
      </h3>
      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
