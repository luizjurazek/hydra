// One-off maintenance: re-fetches the cover image from SteamGridDB for every game in the
// sheet, so all covers use the same portrait "boxart" format instead of whatever mix of
// formats existed before (RAWG/TheGamesDB often return wide banners, not covers).
// Run with:  npx tsx --env-file=.env scripts/normalize-covers.ts
import { normalizeSearchName } from "../lib/enrichment/nameAliases";
import { fetchSteamGridDbImage } from "../lib/enrichment/steamgriddb";
import { runHousekeeping } from "../lib/housekeeping";
import { getSheetsClient, getSpreadsheetId } from "../lib/sheets";
import { DATA_RANGE, gameToRow, rowToGame, SHEET_TAB_NAME } from "../lib/sheetSchema";

const DELAY_BETWEEN_GAMES_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: DATA_RANGE,
    valueRenderOption: "FORMULA",
  });
  const rows = res.data.values ?? [];
  const games = rows
    .map((row, i) => ({ rowNumber: i + 2, game: rowToGame(row) }))
    .filter(({ game }) => game.id && game.title);

  console.log(`Checking SteamGridDB covers for ${games.length} games.`);

  let updated = 0;
  for (const [i, { rowNumber, game }] of games.entries()) {
    process.stdout.write(`[${i + 1}/${games.length}] ${game.title} ... `);
    try {
      const image = await fetchSteamGridDbImage(normalizeSearchName(game.title));
      if (image && image !== game.image) {
        const patched = { ...game, image };
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_TAB_NAME}!A${rowNumber}:N${rowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [gameToRow(patched)] },
        });
        updated++;
        console.log("updated");
      } else if (image) {
        console.log("already up to date");
      } else {
        console.log("no SteamGridDB match, kept existing");
      }
    } catch (err) {
      console.log("failed");
      console.error(err);
    }
    await sleep(DELAY_BETWEEN_GAMES_MS);
  }

  console.log(`Done. ${updated} cover(s) updated. Running housekeeping...`);
  await runHousekeeping();
  console.log("Housekeeping complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
