export type SortOption = "padrao" | "status" | "title" | "ano" | "nota";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "padrao", label: "Ordenar: Padrão" },
  { value: "status", label: "Ordenar: Status" },
  { value: "title", label: "Ordenar: Nome (A-Z)" },
  { value: "ano", label: "Ordenar: Ano" },
  { value: "nota", label: "Ordenar: Nota" },
];
