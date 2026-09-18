"use client";

import { Gamepad2 } from "lucide-react";
import type { Game } from "@/lib/sheetSchema";
import { statusColor, statusLabel } from "@/lib/statusStyles";

interface GameListViewProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

const HEADERS = [
  "Capa",
  "Nome",
  "Status",
  "Gênero",
  "Plataforma",
  "Comprado",
  "Tempo médio",
  "Ano",
  "Início",
  "Final",
  "Tempo de jogo",
  "Nota",
];

export function GameListView({ games, onSelect }: GameListViewProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-white/5 text-left text-xs uppercase tracking-wide text-foreground-secondary">
            {HEADERS.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr
              key={game.id}
              onClick={() => onSelect(game)}
              className="cursor-pointer border-b border-border last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-2">
                <div className="h-14 w-10 overflow-hidden rounded-md bg-white/5 flex items-center justify-center">
                  {game.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Gamepad2 size={16} className="text-foreground-secondary" />
                  )}
                </div>
              </td>
              <td className="px-4 py-2 font-medium text-foreground max-w-[220px] truncate">{game.title}</td>
              <td className="px-4 py-2">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: statusColor(game.status) }}
                >
                  {statusLabel(game.status)}
                </span>
              </td>
              <td className="px-4 py-2 text-foreground-secondary max-w-[200px] truncate">{game.genero || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary whitespace-nowrap">{game.plataforma || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary">{game.comprado ? "Sim" : "Não"}</td>
              <td className="px-4 py-2 text-foreground-secondary whitespace-nowrap">{game.tempoMedio || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary">{game.ano || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary whitespace-nowrap">{game.inicio || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary whitespace-nowrap">{game.final || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary whitespace-nowrap">{game.tempoDeJogo || "-"}</td>
              <td className="px-4 py-2 text-foreground-secondary">{game.nota || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
