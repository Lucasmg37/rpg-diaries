import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifyMasterToken, type MasterPayload } from "./jwt";

/**
 * Helpers de autenticação para API Routes administrativas.
 * Uso típico numa rota protegida:
 *
 *   const session = await getMasterSession(req);
 *   if (!session) return unauthorized();
 */

/** Lê e valida o cookie de sessão do request; retorna o payload ou null. */
export async function getMasterSession(
  req: NextRequest,
): Promise<MasterPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyMasterToken(token);
}

/** Resposta 401 padrão para rotas administrativas. */
export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}
