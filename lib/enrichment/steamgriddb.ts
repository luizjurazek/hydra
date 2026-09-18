import { fetchWithTimeout } from "./http";

interface SteamGridDbSearchResponse {
  data?: { id: number; name?: string }[];
}

interface SteamGridDbGridsResponse {
  data?: { url?: string }[];
}

function authHeaders(key: string) {
  return { Authorization: `Bearer ${key}` };
}

async function searchSteamGridDbGameId(key: string, nome: string): Promise<number | null> {
  const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(nome)}`;
  const searchRes = await fetchWithTimeout(searchUrl, { headers: authHeaders(key) });
  if (!searchRes.ok) return null;

  const searchData: SteamGridDbSearchResponse = await searchRes.json();
  return searchData.data?.[0]?.id ?? null;
}

/** All cover candidates for a game, best match first, so the UI can offer alternatives to a wrong pick. */
export async function fetchSteamGridDbGrids(nome: string): Promise<string[]> {
  const key = process.env.STEAMGRIDDB_API_KEY;
  if (!key) return [];

  try {
    const gameId = await searchSteamGridDbGameId(key, nome);
    if (!gameId) return [];

    const gridsUrl = `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900,342x482,660x930`;
    const gridsRes = await fetchWithTimeout(gridsUrl, { headers: authHeaders(key) });
    if (!gridsRes.ok) return [];

    const gridsData: SteamGridDbGridsResponse = await gridsRes.json();
    return (gridsData.data ?? []).map((grid) => grid.url).filter((url): url is string => Boolean(url));
  } catch {
    return [];
  }
}

/** SteamGridDB specializes in cover/grid art, so it's the primary source for the app's cover images. */
export async function fetchSteamGridDbImage(nome: string): Promise<string | null> {
  const [first] = await fetchSteamGridDbGrids(nome);
  return first ?? null;
}
