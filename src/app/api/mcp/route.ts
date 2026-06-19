import { handleMcpPost, mcpGetNotAllowed } from "@/lib/mcp-server";

/**
 * Servidor MCP (Streamable HTTP / JSON-RPC 2.0). Token de escrita via header
 * `Authorization: Bearer` ou query `?token=`. Para token na rota, use
 * `/api/mcp/<token>`. A lógica vive em `src/lib/mcp-server.ts`.
 */
export async function POST(req: Request) {
  return handleMcpPost(req);
}

export function GET() {
  return mcpGetNotAllowed();
}
