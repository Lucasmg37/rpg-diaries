import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { Session } from "@/core/entities/session";
import { createSession } from "@/core/usecases/create-session";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import { updateSession } from "@/core/usecases/update-session";
import { buildSessionInput, buildSessionPatch } from "@/lib/admin-serializers";
import { isMcpWriteAuthorized } from "@/lib/mcp-auth";

/**
 * Servidor MCP do Diário da Guilda (Streamable HTTP / JSON-RPC 2.0).
 *
 * Implementado diretamente sobre o protocolo JSON-RPC porque o transporte HTTP
 * do @modelcontextprotocol/sdk espera req/res do Node, que não encaixam nos
 * route handlers (fetch API) do Next. O contrato exposto é compatível com
 * clientes MCP que usam Streamable HTTP.
 *
 * Leitura: liberada. Escrita: exige MCP_SERVICE_TOKEN (header Authorization).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const SERVER_INFO = { name: "diario-da-guilda", version: "1.0.0" };
const DEFAULT_PROTOCOL = "2024-11-05";

/** Remove masterNotes de uma Session antes de expor via MCP. */
function stripMasterNotes(session: Session) {
  const { masterNotes: _omit, ...safe } = session;
  return safe;
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  requiresAuth: boolean;
  run: (args: Record<string, any>, req: Request) => Promise<unknown>;
}

const TOOLS: ToolDef[] = [
  {
    name: "getGuildData",
    description:
      "Lê a guild completa (aventuras, sessões, aventureiros e fios soltos) já resolvida. Nunca inclui as notas privadas do mestre.",
    inputSchema: {
      type: "object",
      properties: {
        guildId: {
          type: "string",
          description: "ID da guild. Se omitido, usa a guild do mestre.",
        },
      },
    },
    requiresAuth: false,
    run: async (args) => {
      const guildId = args.guildId ? String(args.guildId) : getMasterGuildId();
      const guild = await getFullGuild(getRepositories(), guildId);
      if (!guild) throw new Error(`Guild "${guildId}" não encontrada.`);
      return guild;
    },
  },
  {
    name: "listSessions",
    description:
      "Lista as sessões de uma aventura (resolvidas, sem notas do mestre).",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string", description: "ID da aventura." },
      },
      required: ["adventureId"],
    },
    requiresAuth: false,
    run: async (args) => {
      const adventureId = String(args.adventureId);
      const guild = await getFullGuild(getRepositories(), getMasterGuildId());
      const adventure = guild?.adventures.find(
        (a) => a.adventure.id === adventureId,
      );
      if (!adventure) throw new Error(`Aventura "${adventureId}" não encontrada.`);
      return adventure.sessions;
    },
  },
  {
    name: "createSession",
    description:
      "Cria uma sessão numa aventura. Os participantes podem trazer o badge contextual de cada aventureiro. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        title: { type: "string" },
        number: { type: "number" },
        icon: { type: "string" },
        summary: { type: "string" },
        masterNotes: { type: "string" },
        timeline: { type: "array", items: { type: "object" } },
        tags: { type: "array", items: { type: "object" } },
        participants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              adventurerId: { type: "string" },
              sessionBadge: { type: "string" },
              sessionState: {
                type: "string",
                enum: ["normal", "suspicious", "fallen", "new"],
              },
              sessionNote: { type: "string" },
            },
            required: ["adventurerId", "sessionBadge"],
          },
        },
        looseEndIds: { type: "array", items: { type: "string" } },
      },
      required: ["adventureId", "title", "number"],
    },
    requiresAuth: true,
    run: async (args) => {
      const input = buildSessionInput(args, getMasterGuildId());
      const created = await createSession(getRepositories(), input);
      return stripMasterNotes(created);
    },
  },
  {
    name: "updateSession",
    description:
      "Atualiza uma sessão existente (campos parciais). Ex.: alterar só o sessionBadge de um participante. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        title: { type: "string" },
        number: { type: "number" },
        icon: { type: "string" },
        summary: { type: "string" },
        masterNotes: { type: "string" },
        timeline: { type: "array", items: { type: "object" } },
        tags: { type: "array", items: { type: "object" } },
        participants: { type: "array", items: { type: "object" } },
        looseEndIds: { type: "array", items: { type: "string" } },
      },
      required: ["sessionId"],
    },
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();

      let adventureId = args.adventureId ? String(args.adventureId) : "";
      if (!adventureId) {
        const guild = await getFullGuild(repos, guildId);
        const owner = guild?.adventures.find((a) =>
          a.sessions.some((s) => s.id === sessionId),
        );
        if (!owner) throw new Error(`Sessão "${sessionId}" não encontrada.`);
        adventureId = owner.adventure.id;
      }

      const patch = buildSessionPatch(args);
      const updated = await updateSession(
        repos,
        guildId,
        adventureId,
        sessionId,
        patch,
      );
      return stripMasterNotes(updated);
    },
  },
];

const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

type RpcMessage = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: any;
};

function rpcResult(id: RpcMessage["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id: RpcMessage["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMessage(msg: RpcMessage, req: Request) {
  const { id, method, params } = msg;

  // Notificações (sem id) não geram resposta.
  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: params?.protocolVersion ?? DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const name = params?.name as string;
      const args = (params?.arguments ?? {}) as Record<string, any>;
      const tool = TOOLS_BY_NAME.get(name);
      if (!tool) {
        return rpcError(id, -32602, `Ferramenta "${name}" desconhecida.`);
      }
      if (tool.requiresAuth && !isMcpWriteAuthorized(req)) {
        return rpcResult(id, {
          content: [
            {
              type: "text",
              text: "Não autorizado: MCP_SERVICE_TOKEN ausente ou inválido.",
            },
          ],
          isError: true,
        });
      }
      try {
        const out = await tool.run(args, req);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
        });
      } catch (e) {
        return rpcResult(id, {
          content: [{ type: "text", text: `Erro: ${(e as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, -32601, `Método "${method}" não suportado.`);
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | RpcMessage
    | RpcMessage[]
    | null;
  if (!body) {
    return Response.json(rpcError(null, -32700, "JSON inválido."), {
      status: 400,
    });
  }

  if (Array.isArray(body)) {
    const responses = (
      await Promise.all(body.map((m) => handleMessage(m, req)))
    ).filter((r) => r !== null);
    if (responses.length === 0) return new Response(null, { status: 202 });
    return Response.json(responses);
  }

  const res = await handleMessage(body, req);
  if (!res) return new Response(null, { status: 202 });
  return Response.json(res);
}

/** O servidor não inicia mensagens (sem SSE); GET não é suportado. */
export function GET() {
  return Response.json(
    rpcError(null, -32601, "Use POST (JSON-RPC) neste endpoint."),
    { status: 405 },
  );
}
