"use client";

import { motion } from "framer-motion";
import { Gamepad2, Star } from "lucide-react";
import type { Game } from "@/lib/sheetSchema";
import { statusColor, statusLabel } from "@/lib/statusStyles";

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface border border-border text-left shadow-lg shadow-black/20"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white/5">
        {game.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.image}
            alt={game.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-2 text-foreground-secondary">
            <Gamepad2 size={28} />
            <span className="text-xs px-2 text-center">{game.title}</span>
          </div>
        )}

        <span
          className="absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow"
          style={{ backgroundColor: statusColor(game.status) }}
        >
          {statusLabel(game.status)}
        </span>

        {game.nota && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white shadow">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {game.nota}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-medium text-foreground">{game.title}</span>
        {(game.inicio || game.final) && (
          <span className="truncate text-xs text-foreground-secondary">
            {[game.inicio, game.final].filter(Boolean).join(" - ")}
          </span>
        )}
        <span className="truncate text-xs text-foreground-secondary">
          {[game.plataforma, game.ano].filter(Boolean).join(" · ") || " "}
        </span>
      </div>
    </motion.button>
  );
}
