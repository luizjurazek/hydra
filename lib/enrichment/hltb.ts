import { HowLongToBeatService } from "howlongtobeat-ts";

/**
 * Fallback for when RAWG has no playtime data — mostly console exclusives RAWG's PC-leaning
 * community under-covers. Uses howlongtobeat-ts, which (unlike a plain HTML scrape) handles
 * the token HowLongToBeat's client-side search now requires. Returns null rather than throwing
 * so callers can fall through to their own default.
 */
export async function fetchHltbTempo(nome: string): Promise<string | null> {
  try {
    const service = new HowLongToBeatService();
    const result = await service.search(nome);
    if (!result.success) return null;

    const mainTimeSeconds = result.data[0]?.mainTime;
    if (!mainTimeSeconds) return null;

    const hours = Math.round((mainTimeSeconds / 3600) * 10) / 10;
    return `${hours}h`;
  } catch {
    return null;
  }
}
