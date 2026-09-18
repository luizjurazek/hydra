import { fetchWithTimeout } from "./http";

export interface RawgResult {
  genero: string;
  ano: string;
  imagem: string;
}

interface RawgGenre {
  name?: string;
}

interface RawgGame {
  genres?: RawgGenre[];
  released?: string;
  background_image?: string;
}

interface RawgSearchResponse {
  results?: RawgGame[];
}

export async function fetchRawg(nome: string): Promise<RawgResult | null> {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(nome)}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data: RawgSearchResponse = await res.json();
    const jogo = data.results?.[0];
    if (!jogo) return null;

    const genero = Array.isArray(jogo.genres)
      ? jogo.genres.map((g) => g.name).filter(Boolean).join(", ")
      : "";
    const ano = typeof jogo.released === "string" ? jogo.released.split("-")[0] : "";
    const imagem = jogo.background_image ?? "";

    return { genero, ano, imagem };
  } catch {
    return null;
  }
}
