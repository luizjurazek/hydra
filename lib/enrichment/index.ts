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
 * Tempo: HowLongToBeat's "main story" time (the more precise, purpose-built number),
 * falling back to RAWG's community-average playtime for anything HLTB has no listing for.
 * TheGamesDB is only called once and reused for whichever of image/genero/ano still needs it.
 */
export async function enrichGame(nomeOriginal: string): Promise<EnrichmentResult> {
  const nome = normalizeSearchName(nomeOriginal);

  const [steamgrid, rawg, hltbTempo] = await Promise.all([
    fetchSteamGridDbImage(nome).catch(() => null),
    fetchRawg(nome).catch(() => null),
    fetchHltbTempo(nome).catch(() => null),
  ]);

  const needsTgdb = !steamgrid || !rawg?.genero || !rawg?.ano;
  const tgdb = needsTgdb ? await fetchTgdb(nome).catch(() => null) : null;

  const tempo = hltbTempo ?? (rawg?.playtime ? `${rawg.playtime}h` : "Indefinido");

  return {
    imagem: steamgrid || rawg?.imagem || tgdb?.imagem || "",
    genero: rawg?.genero || tgdb?.genero || "Desconhecido",
    ano: rawg?.ano || tgdb?.ano || "N/A",
    tempo,
  };
}
