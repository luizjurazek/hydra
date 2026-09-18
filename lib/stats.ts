import { STATUSES } from "./sheetSchema";
import type { Game } from "./sheetSchema";

export interface CountEntry {
  label: string;
  value: number;
}

export interface GameStats {
  totalGames: number;
  totalHours: number;
  notaMedia: number | null;
  plataformaTop: string | null;
  byStatus: (CountEntry & { status: string })[];
  byAno: CountEntry[];
  byNota: CountEntry[];
  byPlataforma: CountEntry[];
}

/** Pulls the first number out of a free-text duration like "45h", "12,5 horas" or "Indefinido". */
function parseHours(value: string): number | null {
  const match = value.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const hours = Number(match[1]);
  return Number.isFinite(hours) ? hours : null;
}

function sortedCounts(counts: Map<string, number>): CountEntry[] {
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeGameStats(games: Game[]): GameStats {
  const statusCounts = new Map<string, number>();
  const anoCounts = new Map<string, number>();
  const notaCounts = new Map<string, number>();
  const plataformaCounts = new Map<string, number>();

  let totalHours = 0;
  let notaSum = 0;
  let notaCount = 0;

  for (const game of games) {
    statusCounts.set(game.status, (statusCounts.get(game.status) ?? 0) + 1);

    if (game.ano) anoCounts.set(game.ano, (anoCounts.get(game.ano) ?? 0) + 1);

    if (game.plataforma) {
      plataformaCounts.set(game.plataforma, (plataformaCounts.get(game.plataforma) ?? 0) + 1);
    }

    const hours = parseHours(game.tempoDeJogo);
    if (hours !== null) totalHours += hours;

    const nota = Number(game.nota);
    if (game.nota && Number.isFinite(nota)) {
      notaSum += nota;
      notaCount += 1;
      const bucket = String(Math.round(nota));
      notaCounts.set(bucket, (notaCounts.get(bucket) ?? 0) + 1);
    }
  }

  const byAno = [...anoCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  const byNota = [...notaCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(a.label) - Number(b.label));

  const byPlataforma = sortedCounts(plataformaCounts);

  const byStatus = STATUSES.map((status) => ({
    status,
    label: status,
    value: statusCounts.get(status) ?? 0,
  }));

  return {
    totalGames: games.length,
    totalHours: Math.round(totalHours),
    notaMedia: notaCount > 0 ? notaSum / notaCount : null,
    plataformaTop: byPlataforma[0]?.label ?? null,
    byStatus,
    byAno,
    byNota,
    byPlataforma,
  };
}
