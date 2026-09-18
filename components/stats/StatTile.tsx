interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="glass-surface flex flex-col gap-1 rounded-2xl p-4">
      <span className="text-xs text-foreground-secondary">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </div>
  );
}
