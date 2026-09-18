// One-off maintenance: re-fetches "Tempo médio" (column H) for every game stuck at
// "Indefinido", using the current enrichment pipeline (HowLongToBeat -> RAWG playtime).
//
// Dry-run by default — prints every change without touching the sheet. Pass --apply to write.
// Run with:  npx tsx --env-file=.env scripts/backfill-tempo-medio.ts [--apply]
import { fetchHltbTempo } from "../lib/enrichment/hltb";
import { normalizeSearchName } from "../lib/enrichment/nameAliases";
import { fetchRawg } from "../lib/enrichment/rawg";
import { getSheetsClient, getSpreadsheetId } from "../lib/sheets";
import { COLUMNS, DATA_RANGE, rowToGame, SHEET_TAB_NAME } from "../lib/sheetSchema";

const COLUMN_H = String.fromCharCode("A".charCodeAt(0) + COLUMNS.TEMPO_MEDIO);
const DELAY_BETWEEN_GAMES_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const apply = process.argv.includes("--apply");
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: DATA_RANGE,
    valueRenderOption: "FORMULA",
  });
  const rows = res.data.values ?? [];

  const targets = rows
    .map((row, i) => ({ rowNumber: i + 2, game: rowToGame(row) }))
    .filter(({ game }) => game.id && game.title && game.tempoMedio === "Indefinido");

  console.log(`${targets.length} of ${rows.length} game(s) stuck at "Indefinido".`);

  const updates: { range: string; values: unknown[][] }[] = [];
  let resolved = 0;

  for (const [i, { rowNumber, game }] of targets.entries()) {
    process.stdout.write(`[${i + 1}/${targets.length}] ${game.title} ... `);
    try {
      const nome = normalizeSearchName(game.title);
      const [hltbTempo, rawg] = await Promise.all([
        fetchHltbTempo(nome).catch(() => null),
        fetchRawg(nome).catch(() => null),
      ]);
      const tempo = hltbTempo ?? (rawg?.playtime ? `${rawg.playtime}h` : null);

      if (tempo) {
        updates.push({ range: `${SHEET_TAB_NAME}!${COLUMN_H}${rowNumber}`, values: [[tempo]] });
        resolved++;
        console.log(tempo);
      } else {
        console.log("still no data");
      }
    } catch (err) {
      console.log("failed");
      console.error(err);
    }
    await sleep(DELAY_BETWEEN_GAMES_MS);
  }

  console.log(`\n${resolved} of ${targets.length} resolved.`);

  if (!apply) {
    console.log("\nDry run only — re-run with --apply to write these changes to the sheet.");
    return;
  }
  if (updates.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates },
  });
  console.log(`Applied ${updates.length} update(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
