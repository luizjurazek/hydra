export const SHEET_TAB_NAME = process.env.SHEET_TAB_NAME || "Jogos";

export const COLUMNS = {
  COUNT: 0,
  IMAGE: 1,
  STATUS: 2,
  GAME: 3,
  GENERO: 4,
  COMPRADO: 5,
  PLATAFORMA: 6,
  TEMPO_MEDIO: 7,
  ANO: 8,
  INICIO: 9,
  FINAL: 10,
  TEMPO_DE_JOGO: 11,
  NOTA: 12,
  ID: 13,
} as const;

export const COLUMN_COUNT = 14;

// Data rows only (row 1 is the header).
export const DATA_RANGE = `${SHEET_TAB_NAME}!A2:N`;

export const STATUSES = ["Playing", "Played", "Backlog", "Stopped", "Drop"] as const;
export type Status = (typeof STATUSES)[number];

/** Default sort order: finished first, then what's active, then what's queued up, then dropped. */
export const STATUS_SORT_ORDER: Record<string, number> = {
  Played: 0,
  Playing: 1,
  Stopped: 2,
  Backlog: 3,
  Drop: 4,
};

export const PLATFORMS = ["PC", "PS4", "PS5", "Switch", "Emulador"] as const;

export interface Game {
  id: string;
  count: string;
  image: string;
  status: string;
  title: string;
  genero: string;
  comprado: boolean;
  plataforma: string;
  tempoMedio: string;
  ano: string;
  inicio: string;
  final: string;
  tempoDeJogo: string;
  nota: string;
}

const IMAGE_FORMULA_RE = /=IMAGE\(\s*"([^"]+)"/i;

/** A cell read with valueRenderOption=FORMULA is either a literal =IMAGE("url") formula or a plain URL string. */
export function extractImageUrl(cell: unknown): string {
  if (typeof cell !== "string" || !cell) return "";
  const match = cell.match(IMAGE_FORMULA_RE);
  if (match) return match[1];
  return cell.startsWith("http") ? cell : "";
}

export function imageFormula(url: string): string {
  return `=IMAGE("${url.replace(/"/g, '""')}")`;
}

function cellToString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

export function rowToGame(row: unknown[]): Game {
  return {
    id: cellToString(row[COLUMNS.ID]),
    count: cellToString(row[COLUMNS.COUNT]),
    image: extractImageUrl(row[COLUMNS.IMAGE]),
    status: cellToString(row[COLUMNS.STATUS]),
    title: cellToString(row[COLUMNS.GAME]),
    genero: cellToString(row[COLUMNS.GENERO]),
    comprado: cellToString(row[COLUMNS.COMPRADO]).toUpperCase() === "TRUE",
    plataforma: cellToString(row[COLUMNS.PLATAFORMA]),
    tempoMedio: cellToString(row[COLUMNS.TEMPO_MEDIO]),
    ano: cellToString(row[COLUMNS.ANO]),
    inicio: cellToString(row[COLUMNS.INICIO]),
    final: cellToString(row[COLUMNS.FINAL]),
    tempoDeJogo: cellToString(row[COLUMNS.TEMPO_DE_JOGO]),
    nota: cellToString(row[COLUMNS.NOTA]),
  };
}

export function gameToRow(game: Game): unknown[] {
  const row = new Array(COLUMN_COUNT).fill("");
  row[COLUMNS.COUNT] = game.count;
  row[COLUMNS.IMAGE] = game.image ? imageFormula(game.image) : "";
  row[COLUMNS.STATUS] = game.status;
  row[COLUMNS.GAME] = game.title;
  row[COLUMNS.GENERO] = game.genero;
  row[COLUMNS.COMPRADO] = game.comprado ? "TRUE" : "FALSE";
  row[COLUMNS.PLATAFORMA] = game.plataforma;
  row[COLUMNS.TEMPO_MEDIO] = game.tempoMedio;
  row[COLUMNS.ANO] = game.ano;
  row[COLUMNS.INICIO] = game.inicio;
  row[COLUMNS.FINAL] = game.final;
  row[COLUMNS.TEMPO_DE_JOGO] = game.tempoDeJogo;
  row[COLUMNS.NOTA] = game.nota;
  row[COLUMNS.ID] = game.id;
  return row;
}
