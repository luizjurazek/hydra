import { after, NextResponse } from "next/server";
import { deleteGame, enrichAndPatchGame, updateGame } from "@/lib/gamesRepo";
import { gamePatchSchema } from "@/lib/validation";

export const maxDuration = 30;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = gamePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  try {
    const game = await updateGame(id, parsed.data);
    after(() => enrichAndPatchGame(id).catch((err) => console.error("Enrichment failed", err)));
    return NextResponse.json({ game });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao atualizar o jogo" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteGame(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao remover o jogo" }, { status: 500 });
  }
}
