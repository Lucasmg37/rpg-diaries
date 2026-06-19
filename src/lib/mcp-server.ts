import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { Session } from "@/core/entities/session";
import { addStoryNote } from "@/core/usecases/add-story-note";
import { createAdventurer } from "@/core/usecases/create-adventurer";
import { createLooseEnd } from "@/core/usecases/create-loose-end";
import { createSession } from "@/core/usecases/create-session";
import { createStoryPlan } from "@/core/usecases/create-story-plan";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import {
  getStoryPlan,
  getStoryPlans,
} from "@/core/usecases/get-story-plans";
import { updateSession } from "@/core/usecases/update-session";
import { updateStoryPlan } from "@/core/usecases/update-story-plan";
import {
  buildAdventurerInput,
  buildLooseEndInput,
  buildSessionInput,
  buildSessionPatch,
  buildStoryNoteInput,
  buildStoryPlanInput,
  buildStoryPlanPatch,
} from "@/lib/admin-serializers";
import { isMcpWriteAuthorized } from "@/lib/mcp-auth";

/**
 * Núcleo do servidor MCP (Streamable HTTP / JSON-RPC 2.0). Vive aqui, fora dos
 * route.ts, porque o Next só aceita exports de handlers HTTP em arquivos de rota.
 * As rotas `/api/mcp` e `/api/mcp/[token]` apenas delegam para `handleMcpPost`.
 *
 * Implementado direto sobre JSON-RPC porque o transporte HTTP do
 * @modelcontextprotocol/sdk espera req/res do Node, que não encaixam nos route
 * handlers (fetch API) do Next. O contrato é compatível com clientes MCP.
 *
 * Leitura: liberada. Escrita: exige MCP_SERVICE_TOKEN (header, query ou rota).
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
  /**
   * JSON Schema do resultado. Quando presente, `tools/call` devolve também
   * `structuredContent` (objeto) além do `content` textual, para clientes que
   * consomem dados estruturados.
   */
  outputSchema?: Record<string, any>;
  requiresAuth: boolean;
  run: (args: Record<string, any>) => Promise<unknown>;
}

/* -------------------------------------------------------------------------- */
/* Fragmentos de JSON Schema reaproveitados nos outputSchema das tools.       */
/* -------------------------------------------------------------------------- */

const participantStateSchema = {
  type: "string",
  enum: ["normal", "suspicious", "fallen", "new"],
};

const timelineEntrySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    icon: { type: "string" },
    callout: { type: "string" },
  },
  required: ["title", "body", "icon"],
};

const tagSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    color: { type: "string" },
    icon: { type: "string" },
  },
  required: ["label", "color"],
};

const closingSchema = {
  type: "object",
  properties: {
    quote: { type: "string" },
    tagline: { type: "string" },
  },
  required: ["quote", "tagline"],
};

const adventurerSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    name: { type: "string" },
    className: { type: "string" },
    icon: { type: "string" },
    level: { type: "number" },
    background: { type: "string" },
    status: { type: "string" },
    sheetUrl: { type: "string" },
  },
  required: [
    "id",
    "guildId",
    "adventureId",
    "name",
    "className",
    "icon",
    "level",
    "background",
    "status",
    "sheetUrl",
  ],
};

const looseEndSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    title: { type: "string" },
    category: { type: "string" },
    description: { type: "string" },
    color: { type: "string" },
    icon: { type: "string" },
    resolved: { type: "boolean" },
  },
  required: [
    "id",
    "guildId",
    "adventureId",
    "title",
    "category",
    "description",
    "color",
    "icon",
    "resolved",
  ],
};

/** Participante embutido (cru) numa Session — referencia o aventureiro por ID. */
const participantSchema = {
  type: "object",
  properties: {
    adventurerId: { type: "string" },
    sessionBadge: { type: "string" },
    sessionState: participantStateSchema,
    sessionNote: { type: "string" },
  },
  required: ["adventurerId", "sessionBadge"],
};

/** Participante resolvido (aventureiro completo + campos da sessão). */
const resolvedParticipantSchema = {
  type: "object",
  properties: {
    adventurer: adventurerSchema,
    sessionBadge: { type: "string" },
    sessionState: participantStateSchema,
    sessionNote: { type: "string" },
  },
  required: ["adventurer", "sessionBadge"],
};

/** Session crua, como devolvida por createSession/updateSession (sem masterNotes). */
const sessionSchema = {
  type: "object",
  description: "Sessão sem as notas privadas do mestre.",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    title: { type: "string" },
    number: { type: "number" },
    icon: { type: "string" },
    summary: { type: "string" },
    timeline: { type: "array", items: timelineEntrySchema },
    tags: { type: "array", items: tagSchema },
    participants: { type: "array", items: participantSchema },
    looseEndIds: { type: "array", items: { type: "string" } },
    closing: closingSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "guildId", "adventureId", "title", "number"],
};

/** Session resolvida (participantes e fios soltos já populados). */
const fullSessionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    title: { type: "string" },
    number: { type: "number" },
    icon: { type: "string" },
    summary: { type: "string" },
    timeline: { type: "array", items: timelineEntrySchema },
    tags: { type: "array", items: tagSchema },
    participants: { type: "array", items: resolvedParticipantSchema },
    looseEnds: { type: "array", items: looseEndSchema },
    closing: closingSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "guildId", "adventureId", "title", "number"],
};

const guildSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    masterId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const adventureSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    order: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const fullAdventureSchema = {
  type: "object",
  properties: {
    adventure: adventureSchema,
    sessions: { type: "array", items: fullSessionSchema },
    adventurers: { type: "array", items: adventurerSchema },
    looseEnds: { type: "array", items: looseEndSchema },
  },
  required: ["adventure", "sessions", "adventurers", "looseEnds"],
};

/** Guild completa resolvida — saída de getGuildData. */
const fullGuildSchema = {
  type: "object",
  properties: {
    guild: guildSchema,
    adventures: { type: "array", items: fullAdventureSchema },
  },
  required: ["guild", "adventures"],
};

/* ---- Roteiro do mestre (StoryPlan) ---------------------------------------
 * Material SIGILOSO de preparação/condução de uma narrativa. Diferente da
 * Session (diário público pós-jogo), nunca entra em getGuildData/fullAdventure
 * e TODAS as tools abaixo exigem MCP_SERVICE_TOKEN — leitura inclusa.       */

const sceneChoiceSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "body"],
};

const sceneBlockSchema = {
  type: "object",
  description:
    'Bloco de cena; "type" define a variante: clue (pista), test (teste de personagem/grupo ou combate), secret (segredo do mestre), danger (risco/consequência), choices (decisões do grupo).',
  properties: {
    type: {
      type: "string",
      enum: ["clue", "test", "secret", "danger", "choices"],
    },
    body: { type: "string" },
    variant: { type: "string", enum: ["test", "combat"] },
    tag: { type: "string" },
    label: { type: "string" },
    choices: { type: "array", items: sceneChoiceSchema },
  },
  required: ["type"],
};

const sceneSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    icon: { type: "string" },
    title: { type: "string" },
    meta: { type: "string" },
    blocks: { type: "array", items: sceneBlockSchema },
  },
  required: ["id", "title", "blocks"],
};

const loreBannerSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    body: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["label", "body"],
};

const storyNoteSchema = {
  type: "object",
  description: "Nota lançada pelo mestre durante o jogo.",
  properties: {
    id: { type: "string" },
    body: { type: "string" },
    sceneId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "body", "createdAt"],
};

const storyPlanSchema = {
  type: "object",
  description:
    "Roteiro do mestre — material sigiloso, vinculado a uma aventura.",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    title: { type: "string" },
    eyebrow: { type: "string" },
    subtitle: { type: "string" },
    loreBanner: loreBannerSchema,
    scenes: { type: "array", items: sceneSchema },
    reward: { type: "string" },
    liveNotes: { type: "array", items: storyNoteSchema },
    order: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "guildId", "adventureId", "title", "scenes", "liveNotes"],
};

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
    outputSchema: fullGuildSchema,
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
    outputSchema: {
      type: "object",
      properties: {
        sessions: { type: "array", items: fullSessionSchema },
      },
      required: ["sessions"],
    },
    requiresAuth: false,
    run: async (args) => {
      const adventureId = String(args.adventureId);
      const guild = await getFullGuild(getRepositories(), getMasterGuildId());
      const adventure = guild?.adventures.find(
        (a) => a.adventure.id === adventureId,
      );
      if (!adventure) throw new Error(`Aventura "${adventureId}" não encontrada.`);
      return { sessions: adventure.sessions };
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
    outputSchema: sessionSchema,
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
    outputSchema: sessionSchema,
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
  {
    name: "createAdventurer",
    description:
      "Cria um aventureiro numa aventura. Cadastrado uma vez e depois referenciado (com badge próprio) em cada sessão. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        name: { type: "string" },
        className: {
          type: "string",
          description: 'Classe do personagem (ex.: "Guerreiro").',
        },
        icon: { type: "string", description: "Emoji/ícone do aventureiro." },
        level: { type: "number" },
        background: { type: "string" },
        status: {
          type: "string",
          description: 'Status permanente (ex.: "Ativo", "Morto"). Padrão "Ativo".',
        },
        sheetUrl: {
          type: "string",
          description: "Link externo para a ficha completa.",
        },
      },
      required: ["adventureId", "name", "className"],
    },
    outputSchema: adventurerSchema,
    requiresAuth: true,
    run: async (args) => {
      const input = buildAdventurerInput(args, getMasterGuildId());
      return createAdventurer(getRepositories(), input);
    },
  },
  {
    name: "createLooseEnd",
    description:
      "Cria um fio solto / gancho narrativo numa aventura. Sessões depois o referenciam via looseEndIds. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        title: { type: "string" },
        category: { type: "string" },
        description: { type: "string" },
        color: {
          type: "string",
          description: 'Cor hex do fio (padrão "#a07a40").',
        },
        icon: { type: "string", description: "Emoji/ícone do fio solto." },
        resolved: {
          type: "boolean",
          description: "Se o fio já foi resolvido. Padrão false.",
        },
      },
      required: ["adventureId", "title"],
    },
    outputSchema: looseEndSchema,
    requiresAuth: true,
    run: async (args) => {
      const input = buildLooseEndInput(args, getMasterGuildId());
      return createLooseEnd(getRepositories(), input);
    },
  },
  {
    name: "listStoryPlans",
    description:
      "Lista os roteiros do mestre (material sigiloso) de uma aventura. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string", description: "ID da aventura." },
      },
      required: ["adventureId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        storyPlans: { type: "array", items: storyPlanSchema },
      },
      required: ["storyPlans"],
    },
    requiresAuth: true,
    run: async (args) => {
      const adventureId = String(args.adventureId);
      const storyPlans = await getStoryPlans(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
      );
      return { storyPlans };
    },
  },
  {
    name: "getStoryPlan",
    description:
      "Obtém um roteiro do mestre pelo id. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
      },
      required: ["storyPlanId", "adventureId"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const plan = await getStoryPlan(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
      );
      if (!plan) throw new Error(`Roteiro "${storyPlanId}" não encontrado.`);
      return plan;
    },
  },
  {
    name: "createStoryPlan",
    description:
      "Cria um roteiro do mestre (cenas, pistas, testes, segredos, riscos e escolhas) vinculado a uma aventura. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        title: { type: "string" },
        eyebrow: { type: "string" },
        subtitle: { type: "string" },
        loreBanner: loreBannerSchema,
        scenes: { type: "array", items: { type: "object" } },
        reward: { type: "string" },
        order: { type: "number" },
      },
      required: ["adventureId", "title"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const input = buildStoryPlanInput(args, getMasterGuildId());
      return createStoryPlan(getRepositories(), input);
    },
  },
  {
    name: "updateStoryPlan",
    description:
      "Atualiza um roteiro do mestre existente (campos parciais). Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
        title: { type: "string" },
        eyebrow: { type: "string" },
        subtitle: { type: "string" },
        loreBanner: loreBannerSchema,
        scenes: { type: "array", items: { type: "object" } },
        reward: { type: "string" },
        order: { type: "number" },
      },
      required: ["storyPlanId", "adventureId"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const patch = buildStoryPlanPatch(args);
      return updateStoryPlan(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
        patch,
      );
    },
  },
  {
    name: "addStoryNote",
    description:
      "Lança uma nota do mestre durante o jogo, sobre uma cena/decisão do grupo num roteiro. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
        body: { type: "string", description: "Texto da nota." },
        sceneId: {
          type: "string",
          description: "Id da cena referenciada (opcional).",
        },
      },
      required: ["storyPlanId", "adventureId", "body"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const note = buildStoryNoteInput(args);
      return addStoryNote(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
        note,
      );
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

async function handleMessage(
  msg: RpcMessage,
  req: Request,
  pathToken?: string,
) {
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
          ...(t.outputSchema ? { outputSchema: t.outputSchema } : {}),
        })),
      });

    case "tools/call": {
      const name = params?.name as string;
      const args = (params?.arguments ?? {}) as Record<string, any>;
      const tool = TOOLS_BY_NAME.get(name);
      if (!tool) {
        return rpcError(id, -32602, `Ferramenta "${name}" desconhecida.`);
      }
      if (tool.requiresAuth && !isMcpWriteAuthorized(req, pathToken)) {
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
        const out = await tool.run(args);
        // Serializa via JSON.parse(JSON.stringify(...)) para normalizar Dates
        // em strings ISO — mesmo formato do `content` textual — e garantir que
        // `structuredContent` seja JSON puro conforme o outputSchema.
        const result: Record<string, any> = {
          content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
        };
        if (tool.outputSchema) {
          result.structuredContent = JSON.parse(JSON.stringify(out));
        }
        return rpcResult(id, result);
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

/** Processa um POST JSON-RPC (single ou batch). `pathToken` vem da rota /[token]. */
export async function handleMcpPost(req: Request, pathToken?: string) {
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
      await Promise.all(body.map((m) => handleMessage(m, req, pathToken)))
    ).filter((r) => r !== null);
    if (responses.length === 0) return new Response(null, { status: 202 });
    return Response.json(responses);
  }

  const res = await handleMessage(body, req, pathToken);
  if (!res) return new Response(null, { status: 202 });
  return Response.json(res);
}

/** O servidor não inicia mensagens (sem SSE); GET não é suportado. */
export function mcpGetNotAllowed() {
  return Response.json(
    rpcError(null, -32601, "Use POST (JSON-RPC) neste endpoint."),
    { status: 405 },
  );
}
