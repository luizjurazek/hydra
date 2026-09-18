"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Game } from "@/lib/sheetSchema";
import { PLATFORMS, STATUSES } from "@/lib/sheetSchema";
import { statusLabel } from "@/lib/statusStyles";

interface GameFormModalProps {
  open: boolean;
  game: Game | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  title: string;
  status: string;
  genero: string;
  comprado: boolean;
  plataforma: string;
  tempoMedio: string;
  ano: string;
  inicio: string;
  final: string;
  tempoDeJogo: string;
  nota: string;
  image: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  status: "Backlog",
  genero: "",
  comprado: false,
  plataforma: "",
  tempoMedio: "",
  ano: "",
  inicio: "",
  final: "",
  tempoDeJogo: "",
  nota: "",
  image: "",
};

function gameToForm(game: Game | null): FormState {
  if (!game) return EMPTY_FORM;
  return {
    title: game.title,
    status: game.status || "Backlog",
    genero: game.genero,
    comprado: game.comprado,
    plataforma: game.plataforma,
    tempoMedio: game.tempoMedio,
    ano: game.ano,
    inicio: game.inicio,
    final: game.final,
    tempoDeJogo: game.tempoDeJogo,
    nota: game.nota,
    image: game.image,
  };
}

const inputClass =
  "w-full rounded-xl bg-white/5 border border-border px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary outline-none focus:border-accent transition-colors";
const labelClass = "text-xs font-medium text-foreground-secondary";

export function GameFormModal({ open, game, onClose, onSaved }: GameFormModalProps) {
  const [form, setForm] = useState<FormState>(() => gameToForm(game));
  const [initializedFor, setInitializedFor] = useState<string | null>(game?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshingCover, setRefreshingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = game?.id ?? "new";
  if (initializedFor !== key) {
    setForm(gameToForm(game));
    setInitializedFor(key);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(game ? `/api/games/${game.id}` : "/api/games", {
        method: game ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Não foi possível salvar");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshCover() {
    if (!game) return;

    setRefreshingCover(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}/refresh-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentImage: form.image }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Não foi possível buscar outra capa");
        return;
      }
      setField("image", data.game.image);
      onSaved();
    } finally {
      setRefreshingCover(false);
    }
  }

  async function handleDelete() {
    if (!game) return;
    if (!window.confirm(`Remover "${game.title}" da planilha?`)) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/${game.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Não foi possível remover");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={game ? "Editar jogo" : "Novo jogo"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Nome do jogo *</label>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Plataforma</label>
            <select
              className={inputClass}
              value={form.plataforma}
              onChange={(e) => setField("plataforma", e.target.value)}
            >
              <option value="">Selecione...</option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Gênero</label>
            <input
              className={inputClass}
              value={form.genero}
              onChange={(e) => setField("genero", e.target.value)}
              placeholder="Preenchido automaticamente"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Ano de lançamento</label>
            <input
              className={inputClass}
              value={form.ano}
              onChange={(e) => setField("ano", e.target.value)}
              placeholder="Preenchido automaticamente"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Tempo médio</label>
            <input
              className={inputClass}
              value={form.tempoMedio}
              onChange={(e) => setField("tempoMedio", e.target.value)}
              placeholder="Preenchido automaticamente"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Tempo de jogo</label>
            <input
              className={inputClass}
              value={form.tempoDeJogo}
              onChange={(e) => setField("tempoDeJogo", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Início</label>
            <input
              className={inputClass}
              value={form.inicio}
              onChange={(e) => setField("inicio", e.target.value)}
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Final</label>
            <input
              className={inputClass}
              value={form.final}
              onChange={(e) => setField("final", e.target.value)}
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nota</label>
            <input
              className={inputClass}
              value={form.nota}
              onChange={(e) => setField("nota", e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              id="comprado"
              checked={form.comprado}
              onChange={(e) => setField("comprado", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <label htmlFor="comprado" className={labelClass}>
              Comprado
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Capa</label>
          <div className="flex items-center gap-3">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-border">
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                className={inputClass}
                value={form.image}
                onChange={(e) => setField("image", e.target.value)}
                placeholder="Preenchido automaticamente"
              />
              {game && (
                <button
                  type="button"
                  onClick={handleRefreshCover}
                  disabled={refreshingCover}
                  className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-foreground-secondary hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={13} className={refreshingCover ? "animate-spin" : ""} />
                  {refreshingCover ? "Buscando..." : "Rebuscar capa"}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[var(--status-drop)]">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {game ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-[var(--status-drop)] hover:bg-[var(--status-drop)]/10 transition-colors disabled:opacity-40"
            >
              <Trash2 size={16} />
              {deleting ? "Removendo..." : "Remover"}
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
