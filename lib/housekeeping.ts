import { getSheetGridId, getSheetsClient, getSpreadsheetId } from "./sheets";
import { COLUMN_COUNT, COLUMNS, DATA_RANGE, SHEET_TAB_NAME } from "./sheetSchema";

const COLUMN_A = String.fromCharCode("A".charCodeAt(0) + COLUMNS.COUNT);
const COLUMN_C = String.fromCharCode("A".charCodeAt(0) + COLUMNS.STATUS);

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Port of the Apps Script's preencherDadosDosJogos housekeeping pass:
 * numbers "Played" rows sequentially, defaults blank "#"/Status cells,
 * then re-sorts every data row by column A. Runs after every create/update/delete.
 */
export async function runHousekeeping(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: DATA_RANGE,
    valueRenderOption: "FORMULA",
  });
  const rows = res.data.values ?? [];

  const valueUpdates: { range: string; values: unknown[][] }[] = [];
  let gamesPlayed = 0;

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // row 1 is the header
    const status = row[COLUMNS.STATUS];
    const count = row[COLUMNS.COUNT];

    if (typeof status === "string" && status.toLowerCase() === "played") {
      gamesPlayed++;
      if (isEmpty(count) || count === "#") {
        valueUpdates.push({ range: `${SHEET_TAB_NAME}!${COLUMN_A}${rowNumber}`, values: [[gamesPlayed]] });
        return;
      }
    }

    if (isEmpty(count)) {
      valueUpdates.push({ range: `${SHEET_TAB_NAME}!${COLUMN_A}${rowNumber}`, values: [["#"]] });
    }

    if (isEmpty(status)) {
      valueUpdates.push({ range: `${SHEET_TAB_NAME}!${COLUMN_C}${rowNumber}`, values: [["Backlog"]] });
    }
  });

  if (valueUpdates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data: valueUpdates },
    });
  }

  if (rows.length > 0) {
    const sheetId = await getSheetGridId();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            sortRange: {
              range: {
                sheetId,
                startRowIndex: 1,
                endRowIndex: 1 + rows.length,
                startColumnIndex: 0,
                endColumnIndex: COLUMN_COUNT,
              },
              sortSpecs: [{ dimensionIndex: 0, sortOrder: "ASCENDING" }],
            },
          },
        ],
      },
    });
  }
}
