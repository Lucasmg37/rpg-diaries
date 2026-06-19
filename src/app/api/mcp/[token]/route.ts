import { handleMcpPost, mcpGetNotAllowed } from "@/lib/mcp-server";

/**
 * Variante do endpoint MCP com o token de serviço no segmento de rota:
 * `/api/mcp/<token>`. Útil para clientes MCP que não permitem headers/query
 * customizados. Atenção: tokens em URL podem vazar em logs.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handleMcpPost(req, token);
}

export function GET() {
  return mcpGetNotAllowed();
}
