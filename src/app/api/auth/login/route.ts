import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signMasterToken,
} from "@/lib/jwt";

/** Comparação em tempo constante (via digest de tamanho fixo). */
function safeEqual(a: string, b: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * POST /api/auth/login — recebe { password }, compara com MASTER_PASSWORD e,
 * em caso de sucesso, emite o JWT e o grava num cookie httpOnly válido por 1h.
 */
export async function POST(req: Request) {
  const masterPassword = process.env.MASTER_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  if (!masterPassword || !jwtSecret) {
    return NextResponse.json(
      { error: "Autenticação não configurada (MASTER_PASSWORD / JWT_SECRET)." },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = body?.password;

  if (typeof password !== "string" || !safeEqual(password, masterPassword)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = await signMasterToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
