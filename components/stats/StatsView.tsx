"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Game } from "@/lib/sheetSchema";
import type { CountEntry, DateField } from "@/lib/stats";
import { computeGameStats, computeMonthlyCounts } from "@/lib/stats";
import { statusColor, statusLabel } from "@/lib/statusStyles";
import { BarChart } from "./BarChart";
import { StatTile } from "./StatTile";

const DATE_FIELD_OPTIONS: { value: DateField; label: string }[] = [
  { value: "inicio", label: "Início" },
  { value: "final", label: "Final" },
];

const selectClass =
  "rounded-full bg-surface border border-border px-4 py-2 text-sm text-foreground-secondary outline-none focus:border-accent transition-colors";

/** Surfaces each bucket's total hours as a sublabel, when known, for extra context beyond the count. */
function withHours(entries: (CountEntry & { color?: string })[]) {
  return entries.map((entry) => ({
    ...entry,
    sublabel: entry.hours ? `${Math.round(entry.hours)}h` : undefined,
  }));
}

export function StatsView() {
  const { data, isLoading } = useSWR<{ games: Game[] }>("/api/games", fetcher);
  const games = useMemo(() => data?.games ?? [], [data]);
  const stats = useMemo(() => computeGameStats(games), [games]);

  const [dateField, setDateField] = useState<DateField>("final");
  const [monthYear, setMonthYear] = useState("");

  const byYearEntries = dateField === "inicio" ? stats.byAnoInicio : stats.byAnoFinal;

  const bestYear = useMemo(
    () => byYearEntries.reduce<CountEntry | null>((best, e) => (!best || e.value > best.value ? e : best), null),
    [byYearEntries]
  );

  const monthlyCounts = useMemo(() => {
    if (!monthYear) return null;
    return computeMonthlyCounts(games, Number(monthYear), dateField);
  }, [games, monthYear, dateField]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Estatísticas</h1>
      </header>

      {isLoading ? (
        <p className="text-foreground-secondary text-sm">Carregando...</p>
      ) : (
        <>
          <div className="glass-surface flex flex-col gap-1 rounded-2xl p-6">
            <span className="text-xs text-foreground-secondary">Total de jogos</span>
            <span className="text-5xl font-semibold text-foreground">{stats.totalGames}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Horas jogadas" value={`${stats.totalHours}h`} />
            <StatTile label="Nota média" value={stats.notaMedia !== null ? stats.notaMedia.toFixed(1) : "—"} />
            <StatTile label="Plataforma favorita" value={stats.plataformaTop ?? "—"} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarChart
              title="Jogos por status"
              entries={withHours(
                stats.byStatus.map((s) => ({
                  label: statusLabel(s.status),
                  value: s.value,
                  hours: s.hours,
                  color: statusColor(s.status),
                }))
              )}
            />
            <BarChart title="Jogos por plataforma" entries={withHours(stats.byPlataforma)} />
            <BarChart title="Jogos por ano de lançamento" entries={stats.byAno} />
            <BarChart title="Distribuição de notas" entries={stats.byNota} unit="jogos" />
          </div>

          <div className="glass-surface flex flex-col gap-4 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">Jogos jogados por ano</h3>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-full bg-white/5 p-1">
                  {DATE_FIELD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateField(option.value);
                        setMonthYear("");
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        dateField === option.value
                          ? "bg-accent text-white"
                          : "text-foreground-secondary hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <select
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Ver por mês...</option>
                  {byYearEntries.map((entry) => (
                    <option key={entry.label} value={entry.label}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {monthlyCounts ? (
              <>
                <BarChart
                  title={`Por mês em ${monthYear} (${dateField === "inicio" ? "início" : "final"})`}
                  entries={withHours(monthlyCounts.months)}
                />
                {monthlyCounts.undated > 0 && (
                  <p className="text-xs text-foreground-secondary">
                    +{monthlyCounts.undated} {monthlyCounts.undated === 1 ? "jogo" : "jogos"} de {monthYear} sem
                    mês definido na planilha (só o ano foi registrado).
                  </p>
                )}
              </>
            ) : (
              <BarChart
                title={dateField === "inicio" ? "Jogos iniciados por ano" : "Jogos finalizados por ano"}
                entries={withHours(byYearEntries)}
              />
            )}

            {bestYear && bestYear.value > 0 && (
              <p className="text-xs text-foreground-secondary">
                Melhor ano: <span className="font-medium text-foreground">{bestYear.label}</span> —{" "}
                {bestYear.value} {bestYear.value === 1 ? "jogo" : "jogos"}
                {bestYear.hours ? `, ${Math.round(bestYear.hours)}h` : ""}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
