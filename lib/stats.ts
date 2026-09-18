import { STATUSES } from "./sheetSchema";
import type { Game } from "./sheetSchema";

export interface CountEntry {
  label: string;
  value: number;
  /** Total hours played across the games in this bucket, when known. */
  hours?: number;
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
  byAnoInicio: CountEntry[];
  byAnoFinal: CountEntry[];
}

export const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export type DateField = "inicio" | "final";

/**
 * Parses the sheet's free-text Início/Final dates. Most rows are dd/mm/yyyy, but older
 * entries only ever recorded the year (e.g. "2022") — those still count toward the
 * yearly totals (month: null), they just can't be placed in a monthly breakdown.
 * "-", blank or anything else yields null.
 */
function parseDateBR(value: string): { year: number; month: number | null } | null {
  const trimmed = value.trim();

  const full = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (full) {
    const month = Number(full[2]);
    const year = Number(full[3]);
    if (month < 1 || month > 12) return null;
    return { year, month };
  }

  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) return { year: Number(yearOnly[1]), month: null };

  return null;
}

function getDateField(game: Game, field: DateField): string {
  return field === "inicio" ? game.inicio : game.final;
}

/** Pulls the first number out of a free-text duration like "45h", "12,5 horas" or "Indefinido". */
function parseHours(value: string): number | null {
  const match = value.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const hours = Number(match[1]);
  return Number.isFinite(hours) ? hours : null;
}

function countsByYear(games: Game[], field: DateField): CountEntry[] {
  const counts = new Map<string, number>();
  const hours = new Map<string, number>();
  for (const game of games) {
    const parsed = parseDateBR(getDateField(game, field));
    if (!parsed) continue;
    const key = String(parsed.year);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const gameHours = parseHours(game.tempoDeJogo);
    if (gameHours !== null) hours.set(key, (hours.get(key) ?? 0) + gameHours);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, hours: hours.get(label) }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}

export interface MonthlyBreakdown {
  months: CountEntry[];
  /** Games that fall in `year` but only have a bare year on the sheet — no month to place them in. */
  undated: number;
}

/** 12-entry Jan-Dez breakdown of games with `field` (inicio/final) falling in `year`. */
export function computeMonthlyCounts(games: Game[], year: number, field: DateField): MonthlyBreakdown {
  const counts = new Array(12).fill(0);
  const hours = new Array(12).fill(0);
  let undated = 0;

  for (const game of games) {
    const parsed = parseDateBR(getDateField(game, field));
    if (!parsed || parsed.year !== year) continue;

    if (parsed.month === null) {
      undated++;
      continue;
    }

    counts[parsed.month - 1] += 1;
    const gameHours = parseHours(game.tempoDeJogo);
    if (gameHours !== null) hours[parsed.month - 1] += gameHours;
  }

  const months = counts.map((value, i) => ({
    label: MONTH_LABELS[i],
    value,
    hours: hours[i] > 0 ? hours[i] : undefined,
  }));

  return { months, undated };
}

function sortedCounts(counts: Map<string, number>, hours: Map<string, number>): CountEntry[] {
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, hours: hours.get(label) }))
    .sort((a, b) => b.value - a.value);
}

export function computeGameStats(games: Game[]): GameStats {
  const statusCounts = new Map<string, number>();
  const statusHours = new Map<string, number>();
  const anoCounts = new Map<string, number>();
  const notaCounts = new Map<string, number>();
  const plataformaCounts = new Map<string, number>();
  const plataformaHours = new Map<string, number>();

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
    if (hours !== null) {
      totalHours += hours;
      statusHours.set(game.status, (statusHours.get(game.status) ?? 0) + hours);
      if (game.plataforma) plataformaHours.set(game.plataforma, (plataformaHours.get(game.plataforma) ?? 0) + hours);
    }

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

  const byPlataforma = sortedCounts(plataformaCounts, plataformaHours);

  const byStatus = STATUSES.map((status) => ({
    status,
    label: status,
    value: statusCounts.get(status) ?? 0,
    hours: statusHours.get(status),
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
    byAnoInicio: countsByYear(games, "inicio"),
    byAnoFinal: countsByYear(games, "final"),
  };
}
