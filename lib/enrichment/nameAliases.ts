/**
 * Cover/metadata APIs index games by their full official name, so short fan abbreviations
 * (like "GTA") often match the wrong game or a fan mod. Expand known abbreviations before
 * searching; the sheet's own "Game" column is never touched, this only affects the query.
 */
const ALIASES: [RegExp, string][] = [[/\bgta\b/i, "Grand Theft Auto"]];

export function normalizeSearchName(nome: string): string {
  return ALIASES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), nome);
}
