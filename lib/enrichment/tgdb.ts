import { fetchWithTimeout } from "./http";

export interface TgdbResult {
  genero: string;
  ano: string;
  imagem: string;
}

interface TgdbGame {
  id: number;
  genres?: (string | { name?: string })[];
  release_date?: string;
  releaseDate?: string;
}

interface TgdbSearchResponse {
  data?: { games?: TgdbGame[] };
}

interface TgdbImage {
  filename?: string;
  url?: string;
  side?: string;
}

interface TgdbImagesResponse {
  data?: { images?: { boxart?: TgdbImage[]; screenshot?: TgdbImage[] } };
}

export async function fetchTgdb(nome: string): Promise<TgdbResult | null> {
  const key = process.env.TGDB_API_KEY;
  if (!key) return null;

  try {
    const searchUrl = `https://api.thegamesdb.net/v1/Games/ByGameName?apikey=${encodeURIComponent(key)}&name=${encodeURIComponent(nome)}`;
    const searchRes = await fetchWithTimeout(searchUrl);
    if (!searchRes.ok) return null;

    const searchData: TgdbSearchResponse = await searchRes.json();
    const jogo = searchData.data?.games?.[0];
    if (!jogo) return null;

    const genero = Array.isArray(jogo.genres)
      ? jogo.genres.map((g) => (typeof g === "string" ? g : g?.name ?? "")).filter(Boolean).join(", ")
      : "";

    const rawDate = jogo.release_date ?? jogo.releaseDate;
    const ano = typeof rawDate === "string" ? rawDate.split("-")[0] : "";

    const imagem = await fetchTgdbImage(key, jogo.id);

    return { genero, ano, imagem };
  } catch {
    return null;
  }
}

async function fetchTgdbImage(key: string, gameId: number): Promise<string> {
  try {
    const url = `https://api.thegamesdb.net/v1/Games/Images?apikey=${encodeURIComponent(key)}&games_id=${gameId}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return "";

    const data: TgdbImagesResponse = await res.json();
    const images = data.data?.images;

    let imagem = "";
    const boxarts = images?.boxart;
    if (Array.isArray(boxarts) && boxarts.length > 0) {
      const front = boxarts.find((img) => img.side === "front" || img.side === "Front");
      imagem = front?.filename || front?.url || boxarts[0]?.filename || boxarts[0]?.url || "";
    }

    if (!imagem && Array.isArray(images?.screenshot) && images.screenshot.length > 0) {
      imagem = images.screenshot[0]?.filename || images.screenshot[0]?.url || "";
    }

    if (imagem && !imagem.startsWith("http")) {
      imagem = `https://cdn.thegamesdb.net/images/${imagem}`;
    }

    return imagem;
  } catch {
    return "";
  }
}
