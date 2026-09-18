interface BarChartEntry {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  entries: BarChartEntry[];
  emptyLabel?: string;
}

/** Horizontal magnitude bars: single hue by default, value labeled directly at the tip. */
export function BarChart({ title, entries, emptyLabel = "Sem dados" }: BarChartProps) {
  const max = Math.max(1, ...entries.map((e) => e.value));

  return (
    <div className="glass-surface flex flex-col gap-3 rounded-2xl p-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>

      {entries.length === 0 ? (
        <p className="text-sm text-foreground-secondary">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-xs text-foreground-secondary" title={entry.label}>
                {entry.label}
              </span>
              <div className="relative flex-1" title={`${entry.label}: ${entry.value}`}>
                <div
                  className="h-[18px] rounded-[4px]"
                  style={{
                    width: `${Math.max((entry.value / max) * 100, 4)}%`,
                    backgroundColor: entry.color ?? "var(--accent)",
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
