import { google, sheets_v4 } from "googleapis";
import { SHEET_TAB_NAME } from "./sheetSchema";

let sheetsClient: sheets_v4.Sheets | null = null;
let cachedSheetGridId: number | null = null;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars");
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEET_ID env var");
  return id;
}

/** Numeric grid id of the "Jogos" tab, needed for sort/delete-row requests. Cached per warm instance. */
export async function getSheetGridId(): Promise<number> {
  if (cachedSheetGridId !== null) return cachedSheetGridId;
  const sheets = getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === SHEET_TAB_NAME);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Sheet tab "${SHEET_TAB_NAME}" not found`);
  }
  cachedSheetGridId = sheetId;
  return sheetId;
}
