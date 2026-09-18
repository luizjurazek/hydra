// One-off maintenance: fills Image/Genero/Tempo/Ano for every existing row that's missing
// them, using the same enrichment pipeline as the app (SteamGridDB/RAWG/TheGamesDB/HLTB).
// Run with:  npx tsx --env-file=.env scripts/backfill-enrichment.ts
import { enrichAndPatchGame, listGames } from "../lib/gamesRepo";

const DELAY_BETWEEN_GAMES_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function needsEnrichment(game: { image: string; genero: string; tempoMedio: string; ano: string }): boolean {
  return !game.image || !game.genero || !game.tempoMedio || !game.ano;
}

async function main() {
  const games = await listGames();
  const pending = games.filter(needsEnrichment);

  console.log(`${pending.length} of ${games.length} games need enrichment.`);

  for (const [i, game] of pending.entries()) {
    process.stdout.write(`[${i + 1}/${pending.length}] ${game.title} ... `);
    try {
      await enrichAndPatchGame(game.id);
      console.log("done");
    } catch (err) {
      console.log("failed");
      console.error(err);
    }
    await sleep(DELAY_BETWEEN_GAMES_MS);
  }

  console.log("Backfill complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
