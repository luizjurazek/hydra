"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import type { SortOption } from "./sortOptions";
import { SORT_OPTIONS } from "./sortOptions";

const NOTA_OPTIONS = [
  { value: "", label: "Qualquer nota" },
  { value: "9", label: "9 ou mais" },
  { value: "8", label: "8 ou mais" },
  { value: "7", label: "7 ou mais" },
  { value: "6", label: "6 ou mais" },
];

type ViewMode = "grid" | "list";

interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  ano: string;
  onAnoChange: (value: string) => void;
  availableYears: string[];
  notaMin: string;
  onNotaMinChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

const selectClass =
  "rounded-full bg-surface border border-border px-4 py-2 text-sm text-foreground-secondary outline-none focus:border-accent transition-colors";

export function SearchAndFilters({
  search,
  onSearchChange,
  ano,
  onAnoChange,
  availableYears,
  notaMin,
  onNotaMinChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: SearchAndFiltersProps) {
  const hasActiveFilters = Boolean(search || ano || notaMin);

  function clearAll() {
    onSearchChange("");
    onAnoChange("");
    onNotaMinChange("");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-[200px] max-w-sm sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar jogo..."
            className="w-full rounded-full bg-surface border border-border pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary outline-none focus:border-accent transition-colors sm:w-56"
          />
        </div>

        <select value={ano} onChange={(e) => onAnoChange(e.target.value)} className={selectClass}>
          <option value="">Qualquer ano</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select value={notaMin} onChange={(e) => onNotaMinChange(e.target.value)} className={selectClass}>
          {NOTA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-foreground-secondary hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="glass-surface flex w-fit gap-1 rounded-full p-1">
          <button
            onClick={() => onViewModeChange("grid")}
            aria-label="Visualização em grade"
            className={`rounded-full p-2 transition-colors ${
              viewMode === "grid" ? "bg-accent text-white" : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            aria-label="Visualização em lista"
            className={`rounded-full p-2 transition-colors ${
              viewMode === "list" ? "bg-accent text-white" : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
