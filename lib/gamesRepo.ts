import { randomUUID } from "crypto";
import { enrichGame } from "./enrichment";
import { normalizeSearchName } from "./enrichment/nameAliases";
import { fetchSteamGridDbGrids } from "./enrichment/steamgriddb";
import { runHousekeeping } from "./housekeeping";
import { getSheetsClient, getSheetGridId, getSpreadsheetId } from "./sheets";
import { COLUMNS, DATA_RANGE, Game, gameToRow, rowToGame, SHEET_TAB_NAME } from "./sheetSchema";
import type { GameInput, GamePatch } from "./validation";

async function readRawRows(): Promise<unknown[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: DATA_RANGE,
    valueRenderOption: "FORMULA",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  return res.data.values ?? [];
}

async function findRowById(id: string): Promise<{ rowNumber: number; row: unknown[] } | null> {
  const rows = await readRawRows();
  const index = rows.findIndex((row) => row[COLUMNS.ID] === id);
  if (index === -1) return null;
  return { rowNumber: index + 2, row: rows[index] }; // row 1 is the header
}

export async function listGames(): Promise<Game[]> {
  const rows = await readRawRows();
  return rows.filter((row) => row[COLUMNS.ID]).map(rowToGame);
}

export async function createGame(input: GameInput): Promise<Game> {
  const game: Game = {
    id: randomUUID(),
    count: "",
    image: input.image ?? "",
    status: input.status ?? "Backlog",
    title: input.title,
    genero: input.genero ?? "",
    comprado: input.comprado ?? false,
    plataforma: input.plataforma ?? "",
    tempoMedio: input.tempoMedio ?? "",
    ano: input.ano ?? "",
    inicio: input.inicio ?? "",
    final: input.final ?? "",
    tempoDeJogo: input.tempoDeJogo ?? "",
    nota: input.nota ?? "",
  };

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: DATA_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [gameToRow(game)] },
  });

  await runHousekeeping();
  return game;
}

export async function updateGame(id: string, patch: GamePatch): Promise<Game> {
  const found = await findRowById(id);
  if (!found) throw new Error("Game not found");

  const current = rowToGame(found.row);
  const updated: Game = {
    ...current,
    ...patch,
    id,
  };

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_TAB_NAME}!A${found.rowNumber}:N${found.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [gameToRow(updated)] },
  });

  await runHousekeeping();
  return updated;
}

export async function deleteGame(id: string): Promise<void> {
  const found = await findRowById(id);
  if (!found) throw new Error("Game not found");

  const sheets = getSheetsClient();
  const sheetId = await getSheetGridId();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: found.rowNumber - 1,
              endIndex: found.rowNumber,
            },
          },
        },
      ],
    },
  });

  await runHousekeeping();
}

/**
 * Picks the next SteamGridDB cover candidate that isn't the one currently shown, so repeated
 * clicks cycle through alternatives instead of re-fetching the same (possibly wrong) match.
 */
export async function refreshCoverImage(id: string, currentImage: string): Promise<Game> {
  const found = await findRowById(id);
  if (!found) throw new Error("Game not found");

  const current = rowToGame(found.row);
  if (!current.title) throw new Error("Game has no title");

  const candidates = await fetchSteamGridDbGrids(normalizeSearchName(current.title));
  const next = candidates.find((url) => url !== currentImage) ?? candidates[0];
  if (!next) throw new Error("Nenhuma outra capa encontrada");

  const fresh = await findRowById(id);
  if (!fresh) throw new Error("Game not found");
  const freshGame = rowToGame(fresh.row);
  const patched: Game = { ...freshGame, image: next };

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_TAB_NAME}!A${fresh.rowNumber}:N${fresh.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [gameToRow(patched)] },
  });

  return patched;
}

/**
 * Fills only the still-empty Image/Genero/Tempo/Ano cells for a row, using freshly
 * re-read data so a manual Sheet edit made while the lookup was in flight isn't clobbered.
 */
export async function enrichAndPatchGame(id: string): Promise<void> {
  const found = await findRowById(id);
  if (!found) return;

  const current = rowToGame(found.row);
  if (!current.title) return;

  const needsEnrichment = !current.image || !current.genero || !current.tempoMedio || !current.ano;
  if (!needsEnrichment) return;

  const result = await enrichGame(current.title);

  const fresh = await findRowById(id);
  if (!fresh) return;
  const freshGame = rowToGame(fresh.row);

  const patched: Game = {
    ...freshGame,
    image: freshGame.image || result.imagem,
    genero: freshGame.genero || result.genero,
    tempoMedio: freshGame.tempoMedio || result.tempo,
    ano: freshGame.ano || result.ano,
  };

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_TAB_NAME}!A${fresh.rowNumber}:N${fresh.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [gameToRow(patched)] },
  });

  await runHousekeeping();
}
