interface BarChartEntry {
  label: string;
  value: number;
  color?: string;
  /** Extra context shown after the value, e.g. total hours for that year ("210h"). */
  sublabel?: string;
}

interface BarChartProps {
  title: string;
  entries: BarChartEntry[];
  emptyLabel?: string;
  /** Unit name used in the header subtitle and value suffix, e.g. "jogos" or "h". */
  unit?: string;
}

const GUIDE_STOPS = [25, 50, 75];

/**
 * Horizontal magnitude bars against a full-width track, so each value reads relative to
 * the largest one instead of floating in empty space. One hue (the chart's job is
 * magnitude, not identity) unless entries carry their own reserved color (e.g. status).
 */
export function BarChart({ title, entries, emptyLabel = "Sem dados", unit = "jogos" }: BarChartProps) {
  const max = Math.max(1, ...entries.map((e) => e.value));
  const total = entries.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="glass-surface flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {entries.length > 0 && (
          <span className="text-xs text-foreground-secondary">
            {total} {unit}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-foreground-secondary">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-xs text-foreground-secondary" title={entry.label}>
                  {entry.label}
                </span>

                <div className="relative h-5 flex-1 rounded-[4px] bg-white/5" title={`${entry.label}: ${entry.value}`}>
                  {GUIDE_STOPS.map((stop) => (
                    <div
                      key={stop}
                      className="absolute inset-y-0 w-px bg-border"
                      style={{ left: `${stop}%` }}
                    />
                  ))}
                  <div
                    className="relative h-full rounded-r-[4px]"
                    style={{
                      width: `${Math.max((entry.value / max) * 100, entry.value > 0 ? 3 : 0)}%`,
                      backgroundColor: entry.color ?? "var(--accent)",
                    }}
                  />
                </div>

                <span className="w-24 shrink-0 text-right text-xs text-foreground-secondary">
                  <span className="font-medium text-foreground">{entry.value}</span>
                  {total > 0 && ` · ${pct}%`}
                  {entry.sublabel && <span className="block text-[10px] leading-tight">{entry.sublabel}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
