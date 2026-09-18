"use client";

import { BarChart3, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Game } from "@/lib/sheetSchema";
import { STATUS_SORT_ORDER } from "@/lib/sheetSchema";
import { GameCard } from "./GameCard";
import { GameFormModal } from "./GameFormModal";
import { GameListView } from "./GameListView";
import { SearchAndFilters } from "./SearchAndFilters";
import type { SortOption } from "./sortOptions";
import { StaleGamesBanner } from "./StaleGamesBanner";
import { StatusFilterBar } from "./StatusFilterBar";

type ViewMode = "grid" | "list";
const VIEW_MODE_STORAGE_KEY = "me-games:view-mode";

const MAX_POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 2500;

function needsEnrichment(game: Game): boolean {
  return !game.image;
}

function compareGames(a: Game, b: Game, sortBy: SortOption): number {
  const byTitle = () => a.title.localeCompare(b.title, "pt-BR");

  switch (sortBy) {
    case "title":
      return byTitle();
    case "ano": {
      const diff = (Number(b.ano) || 0) - (Number(a.ano) || 0);
      return diff !== 0 ? diff : byTitle();
    }
    case "nota": {
      const diff = (Number(b.nota) || 0) - (Number(a.nota) || 0);
      return diff !== 0 ? diff : byTitle();
    }
    case "status": {
      const diff = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
      return diff !== 0 ? diff : byTitle();
    }
    case "padrao":
    default: {
      // Dropped games always sink to the bottom, regardless of their count value.
      const aDrop = a.status === "Drop";
      const bDrop = b.status === "Drop";
      if (aDrop !== bDrop) return aDrop ? 1 : -1;

      // Otherwise mirrors the sheet's column A: numeric play order for "Played" rows,
      // "#"/blank (parsed as +Infinity) for everything else, kept in API order.
      const countA = Number(a.count);
      const countB = Number(b.count);
      const valueA = Number.isFinite(countA) ? countA : Infinity;
      const valueB = Number.isFinite(countB) ? countB : Infinity;
      return valueA - valueB;
    }
  }
}

export function GameGrid() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [anoFilter, setAnoFilter] = useState("");
  const [notaMin, setNotaMin] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("padrao");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const pollAttempts = useRef(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-viewer preference on mount
      if (stored === "grid" || stored === "list") setViewMode(stored);
    } catch {
      // ignore (private browsing, etc.)
    }
  }, []);

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }

  const { data, isLoading, mutate } = useSWR<{ games: Game[] }>("/api/games", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: (latestData) => {
      const games = latestData?.games ?? [];
      const pending = games.some(needsEnrichment);
      if (!pending) {
        pollAttempts.current = 0;
        return 0;
      }
      if (pollAttempts.current >= MAX_POLL_ATTEMPTS) return 0;
      pollAttempts.current += 1;
      return POLL_INTERVAL_MS;
    },
  });

  const games = useMemo(() => data?.games ?? [], [data]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const game of games) {
      acc[game.status] = (acc[game.status] ?? 0) + 1;
    }
    return acc;
  }, [games]);

  const availableYears = useMemo(() => {
    const years = new Set(games.map((g) => g.ano).filter(Boolean));
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [games]);

  const filteredGames = useMemo(() => {
    let list = statusFilter ? games.filter((g) => g.status === statusFilter) : games;

    const query = search.trim().toLowerCase();
    if (query) list = list.filter((g) => g.title.toLowerCase().includes(query));

    if (anoFilter) list = list.filter((g) => g.ano === anoFilter);

    if (notaMin) {
      const min = Number(notaMin);
      list = list.filter((g) => Number(g.nota) >= min);
    }

    return [...list].sort((a, b) => compareGames(a, b, sortBy));
  }, [games, statusFilter, search, anoFilter, notaMin, sortBy]);

  function openCreate() {
    setSelectedGame(null);
    setModalOpen(true);
  }

  function openEdit(game: Game) {
    setSelectedGame(game);
    setModalOpen(true);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
      <StaleGamesBanner games={games} onView={() => setStatusFilter("Stopped")} />

      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Hidra"
            className="h-14 w-14"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/estatisticas"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground transition-colors"
            aria-label="Estatísticas"
          >
            <BarChart3 size={16} />
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Novo jogo
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground transition-colors"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <StatusFilterBar value={statusFilter} onChange={setStatusFilter} counts={counts} />

      <SearchAndFilters
        search={search}
        onSearchChange={setSearch}
        ano={anoFilter}
        onAnoChange={setAnoFilter}
        availableYears={availableYears}
        notaMin={notaMin}
        onNotaMinChange={setNotaMin}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
      />

      {isLoading ? (
        <p className="text-foreground-secondary text-sm">Carregando...</p>
      ) : filteredGames.length === 0 ? (
        <p className="text-foreground-secondary text-sm">Nenhum jogo encontrado.</p>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} onClick={() => openEdit(game)} />
          ))}
        </div>
      ) : (
        <GameListView games={filteredGames} onSelect={openEdit} />
      )}

      <GameFormModal
        open={modalOpen}
        game={selectedGame}
        onClose={() => setModalOpen(false)}
        onSaved={() => mutate()}
      />
    </main>
  );
}
