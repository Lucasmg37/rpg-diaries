import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/jwt";

/** POST /api/auth/logout — limpa o cookie de sessão do Master. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
