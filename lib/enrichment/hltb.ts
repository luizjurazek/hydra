import { fetchWithTimeout } from "./http";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const MAIN_STORY_RE = /Main Story[\s\S]{0,500}?([\d½¼¾]+)\s*Hours?/i;

/**
 * HowLongToBeat has no public API — this scrapes its search page HTML for the "Main Story"
 * hours figure. Best-effort only: HLTB can change its markup at any time, so any failure
 * (timeout, non-200, no regex match) falls back to "Indefinido" rather than surfacing an error.
 */
export async function fetchHltbTempo(nome: string): Promise<string> {
  try {
    const url = `https://howlongtobeat.com/?q=${encodeURIComponent(nome)}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return "Indefinido";

    const html = await res.text();
    const match = html.match(MAIN_STORY_RE);
    return match ? `${match[1]}h` : "Indefinido";
  } catch {
    return "Indefinido";
  }
}
