import { fetchHltbTempo } from "./hltb";
import { normalizeSearchName } from "./nameAliases";
import { fetchRawg } from "./rawg";
import { fetchSteamGridDbImage } from "./steamgriddb";
import { fetchTgdb } from "./tgdb";

export interface EnrichmentResult {
  imagem: string;
  genero: string;
  ano: string;
  tempo: string;
}

/**
 * Image: SteamGridDB (dedicated cover art) -> RAWG background_image -> TheGamesDB boxart.
 * Genero/Ano: RAWG -> TheGamesDB, same order as the original Apps Script.
 * TheGamesDB is only called once and reused for whichever of image/genero/ano still needs it.
 */
export async function enrichGame(nomeOriginal: string): Promise<EnrichmentResult> {
  const nome = normalizeSearchName(nomeOriginal);

  const [steamgrid, rawg, tempo] = await Promise.all([
    fetchSteamGridDbImage(nome).catch(() => null),
    fetchRawg(nome).catch(() => null),
    fetchHltbTempo(nome).catch(() => "Indefinido"),
  ]);

  const needsTgdb = !steamgrid || !rawg?.genero || !rawg?.ano;
  const tgdb = needsTgdb ? await fetchTgdb(nome).catch(() => null) : null;

  return {
    imagem: steamgrid || rawg?.imagem || tgdb?.imagem || "",
    genero: rawg?.genero || tgdb?.genero || "Desconhecido",
    ano: rawg?.ano || tgdb?.ano || "N/A",
    tempo: tempo || "Indefinido",
  };
}
