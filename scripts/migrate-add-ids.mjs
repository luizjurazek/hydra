// One-off migration: adds the "ID" column (N) the app needs to uniquely address rows,
// and backfills a UUID for every existing data row that doesn't have one yet.
// Run once with:  node --env-file=.env scripts/migrate-add-ids.mjs
import { randomUUID } from "node:crypto";
import { google } from "googleapis";

const SHEET_TAB_NAME = process.env.SHEET_TAB_NAME || "Jogos";
const ID_COLUMN_LETTER = "N";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} env var`);
  return value;
}

async function main() {
  const email = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const spreadsheetId = requireEnv("GOOGLE_SHEET_ID");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB_NAME}!${ID_COLUMN_LETTER}1`,
  });
  const currentHeader = header.data.values?.[0]?.[0];
  if (currentHeader !== "ID") {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB_NAME}!${ID_COLUMN_LETTER}1`,
      valueInputOption: "RAW",
      requestBody: { values: [["ID"]] },
    });
    console.log(`Header "${ID_COLUMN_LETTER}1" set to "ID".`);
  }

  // Read the full row range (not just column N) — if column N were empty for every
  // row, querying it alone would come back with no values at all, since Sheets omits
  // trailing empty columns/rows from a range read.
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB_NAME}!A2:N`,
  });
  const rows = data.data.values ?? [];
  const ID_COLUMN_INDEX = 13;

  const updates = [];
  rows.forEach((row, i) => {
    const existingId = row[ID_COLUMN_INDEX];
    if (!existingId) {
      const rowNumber = i + 2;
      updates.push({
        range: `${SHEET_TAB_NAME}!${ID_COLUMN_LETTER}${rowNumber}`,
        values: [[randomUUID()]],
      });
    }
  });

  if (updates.length === 0) {
    console.log("No rows needed an ID. Nothing to do.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data: updates },
  });

  console.log(`Assigned a new ID to ${updates.length} row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
