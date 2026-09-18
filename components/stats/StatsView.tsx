"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Game } from "@/lib/sheetSchema";
import { computeGameStats } from "@/lib/stats";
import { statusColor, statusLabel } from "@/lib/statusStyles";
import { BarChart } from "./BarChart";
import { StatTile } from "./StatTile";

export function StatsView() {
  const { data, isLoading } = useSWR<{ games: Game[] }>("/api/games", fetcher);
  const games = useMemo(() => data?.games ?? [], [data]);
  const stats = useMemo(() => computeGameStats(games), [games]);

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
              entries={stats.byStatus.map((s) => ({
                label: statusLabel(s.status),
                value: s.value,
                color: statusColor(s.status),
              }))}
            />
            <BarChart title="Jogos por plataforma" entries={stats.byPlataforma} />
            <BarChart title="Jogos por ano de lançamento" entries={stats.byAno} />
            <BarChart title="Distribuição de notas" entries={stats.byNota} />
          </div>
        </>
      )}
    </main>
  );
}
