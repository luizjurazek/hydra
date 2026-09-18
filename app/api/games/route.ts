import { after, NextResponse } from "next/server";
import { createGame, enrichAndPatchGame, listGames } from "@/lib/gamesRepo";
import { gameInputSchema } from "@/lib/validation";

export const maxDuration = 30;

export async function GET() {
  try {
    const games = await listGames();
    return NextResponse.json({ games });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao carregar os jogos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = gameInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  try {
    const game = await createGame(parsed.data);
    after(() => enrichAndPatchGame(game.id).catch((err) => console.error("Enrichment failed", err)));
    return NextResponse.json({ game }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao criar o jogo" }, { status: 500 });
  }
}
