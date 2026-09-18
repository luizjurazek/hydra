"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Game } from "@/lib/sheetSchema";

const STALE_DAYS = 90;
const REMIND_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_HIDE_MS = 8000;
const STORAGE_KEY = "hidra:stale-banner:last-shown";

interface StaleGamesBannerProps {
  games: Game[];
  onView: () => void;
}

/** Lenient dd/mm/aaaa parser for the free-text date fields; returns null for anything unparseable. */
function parseDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function StaleGamesBanner({ games, onView }: StaleGamesBannerProps) {
  const [visible, setVisible] = useState(false);

  const staleGames = useMemo(() => {
    const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    return games.filter((g) => {
      if (g.status !== "Stopped") return false;
      const final = parseDate(g.final);
      return final !== null && final.getTime() < cutoff;
    });
  }, [games]);

  useEffect(() => {
    if (staleGames.length === 0) return;

    try {
      const lastShown = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      if (Date.now() - lastShown < REMIND_EVERY_MS) return;
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // private browsing, etc. — show once for this session instead of never
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [staleGames.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
        >
          <button
            onClick={() => {
              onView();
              setVisible(false);
            }}
            className="glass-surface flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-left shadow-lg shadow-black/40"
          >
            <BellRing size={18} className="shrink-0 text-accent" />
            <span className="flex-1 text-sm text-foreground">
              {staleGames.length === 1
                ? `"${staleGames[0].title}" está parado há mais de ${STALE_DAYS} dias.`
                : `${staleGames.length} jogos parados há mais de ${STALE_DAYS} dias.`}{" "}
              <span className="text-foreground-secondary">Bora retomar?</span>
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setVisible(false);
                }
              }}
              className="shrink-0 rounded-full p-1 text-foreground-secondary hover:bg-white/10 hover:text-foreground transition-colors"
              aria-label="Dispensar"
            >
              <X size={14} />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
