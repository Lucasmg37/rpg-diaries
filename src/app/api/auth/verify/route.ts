import { NextResponse, type NextRequest } from "next/server";

import { getMasterSession } from "@/lib/auth-middleware";

/**
 * GET /api/auth/verify — usado pela guarda client-side do /admin.
 * 200 se a sessão é válida; 401 caso contrário.
 */
export async function GET(req: NextRequest) {
  const session = await getMasterSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
