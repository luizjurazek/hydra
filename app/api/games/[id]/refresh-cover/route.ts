import { NextResponse } from "next/server";
import { z } from "zod";
import { refreshCoverImage } from "@/lib/gamesRepo";

export const maxDuration = 30;

const bodySchema = z.object({ currentImage: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    const game = await refreshCoverImage(id, parsed.data.currentImage ?? "");
    return NextResponse.json({ game });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Falha ao buscar outra capa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
