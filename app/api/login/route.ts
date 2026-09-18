import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE_NAME, verifyPassword } from "@/lib/auth";

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 400 });
  }

  const valid = await verifyPassword(parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}
