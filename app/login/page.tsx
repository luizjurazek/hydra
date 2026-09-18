"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Não foi possível entrar");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-surface w-full max-w-sm rounded-3xl p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-12 w-12 mb-1"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="text-2xl font-semibold">Hidra</h1>
          <p className="text-sm text-foreground-secondary">Entre para gerenciar seu backlog</p>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="rounded-xl bg-white/5 border border-border px-4 py-3 text-foreground placeholder:text-foreground-secondary outline-none focus:border-accent transition-colors"
        />

        {error && <p className="text-sm text-[var(--status-drop)]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="rounded-xl bg-accent text-white font-medium py-3 transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
