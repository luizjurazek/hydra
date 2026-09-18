// One-off fix: re-searches covers for the "GTA ..." titles using the new name-alias
// expansion (GTA -> Grand Theft Auto), which the earlier normalize-covers run predates.
// Run with:  npx tsx --env-file=.env scripts/fix-gta-covers.ts
import { normalizeSearchName } from "../lib/enrichment/nameAliases";
import { fetchSteamGridDbGrids } from "../lib/enrichment/steamgriddb";
import { runHousekeeping } from "../lib/housekeeping";
import { getSheetsClient, getSpreadsheetId } from "../lib/sheets";
import { DATA_RANGE, gameToRow, rowToGame, SHEET_TAB_NAME } from "../lib/sheetSchema";

async function main() {
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
    .filter(({ game }) => /^gta\b/i.test(game.title));

  console.log(`Found ${targets.length} GTA-titled rows.`);

  for (const { rowNumber, game } of targets) {
    const query = normalizeSearchName(game.title);
    process.stdout.write(`${game.title} -> "${query}" ... `);
    const candidates = await fetchSteamGridDbGrids(query);
    const image = candidates[0];
    if (!image) {
      console.log("no match found, kept existing");
      continue;
    }
    const patched = { ...game, image };
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB_NAME}!A${rowNumber}:N${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [gameToRow(patched)] },
    });
    console.log("updated");
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  await runHousekeeping();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
