import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Autenticação do servidor MCP. As operações de ESCRITA (createSession,
 * updateSession) exigem o token de serviço em `MCP_SERVICE_TOKEN`, enviado no
 * header `Authorization: Bearer <token>` (ou `X-MCP-Token: <token>`).
 * As operações de LEITURA são liberadas sem token.
 */

function safeEqual(a: string, b: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Extrai o token do header (Bearer ou X-MCP-Token). */
function extractToken(req: Request): string {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-mcp-token")?.trim() ?? "";
}

/** True se o request traz o token de serviço correto para operações de escrita. */
export function isMcpWriteAuthorized(req: Request): boolean {
  const expected = process.env.MCP_SERVICE_TOKEN;
  if (!expected) return false; // sem token configurado → escrita bloqueada
  const provided = extractToken(req);
  if (!provided) return false;
  return safeEqual(provided, expected);
}
