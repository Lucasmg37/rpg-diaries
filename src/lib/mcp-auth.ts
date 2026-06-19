import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Autenticação do servidor MCP. As operações de ESCRITA (createSession,
 * updateSession) exigem o token de serviço em `MCP_SERVICE_TOKEN`. Ele pode ser
 * enviado de três formas (para máxima compatibilidade entre clientes):
 *   1. Header `Authorization: Bearer <token>` (ou `X-MCP-Token: <token>`)
 *   2. Query string `?token=<token>`
 *   3. Segmento de rota `/api/mcp/<token>`
 * As operações de LEITURA são liberadas sem token.
 *
 * Atenção: token em URL (query/rota) pode acabar em logs de servidores/proxies —
 * prefira o header quando o cliente permitir.
 */

function safeEqual(a: string, b: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Extrai o token de header, query string ou segmento de rota (nesta ordem). */
function extractToken(req: Request, pathToken?: string): string {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();

  const headerToken = req.headers.get("x-mcp-token");
  if (headerToken) return headerToken.trim();

  const queryToken = new URL(req.url).searchParams.get("token");
  if (queryToken) return queryToken.trim();

  if (pathToken) return pathToken.trim();

  return "";
}

/** True se o request traz o token de serviço correto para operações de escrita. */
export function isMcpWriteAuthorized(req: Request, pathToken?: string): boolean {
  const expected = process.env.MCP_SERVICE_TOKEN;
  if (!expected) return false; // sem token configurado → escrita bloqueada
  const provided = extractToken(req, pathToken);
  if (!provided) return false;
  return safeEqual(provided, expected);
}
