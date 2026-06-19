import { NextResponse, type NextRequest } from "next/server";

import { getMasterSession, unauthorized } from "@/lib/auth-middleware";

/**
 * POST /api/admin/publish — dispara o Vercel Deploy Hook (DEPLOY_HOOK_URL).
 * A Vercel responde imediatamente criando o job de deploy; não há polling.
 */
export async function POST(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const hookUrl = process.env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return NextResponse.json(
      { error: "DEPLOY_HOOK_URL não configurado." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(hookUrl, { method: "POST" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Deploy hook respondeu ${res.status}.` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao chamar o deploy hook: ${(e as Error).message}` },
      { status: 502 },
    );
  }
}
