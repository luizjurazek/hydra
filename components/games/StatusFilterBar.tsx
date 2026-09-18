"use client";

import { STATUSES } from "@/lib/sheetSchema";
import { statusLabel } from "@/lib/statusStyles";

interface StatusFilterBarProps {
  value: string | null;
  onChange: (value: string | null) => void;
  counts: Record<string, number>;
}

export function StatusFilterBar({ value, onChange, counts }: StatusFilterBarProps) {
  const options: (string | null)[] = [null, ...STATUSES];

  return (
    <div className="glass-surface sticky top-4 z-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full p-1">
      {options.map((status) => {
        const active = status === value;
        const label = status === null ? "Todos" : statusLabel(status);
        const count = status === null ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[status] ?? 0;

        return (
          <button
            key={status ?? "all"}
            onClick={() => onChange(status)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-accent text-white" : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            {label} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
