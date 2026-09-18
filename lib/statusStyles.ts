export const STATUS_LABELS: Record<string, string> = {
  Playing: "Jogando",
  Played: "Jogado",
  Backlog: "Backlog",
  Stopped: "Pausado",
  Drop: "Abandonado",
};

export const STATUS_COLORS: Record<string, string> = {
  Playing: "var(--status-playing)",
  Played: "var(--status-played)",
  Backlog: "var(--status-backlog)",
  Stopped: "var(--status-stopped)",
  Drop: "var(--status-drop)",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "var(--foreground-secondary)";
}
