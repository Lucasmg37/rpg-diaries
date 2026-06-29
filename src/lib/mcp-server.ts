import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { Npc } from "@/core/entities/npc";
import type { Session } from "@/core/entities/session";
import { addStoryNote } from "@/core/usecases/add-story-note";
import { createAdventurer } from "@/core/usecases/create-adventurer";
import { appendAdventurerEvent } from "@/core/usecases/append-adventurer-event";
import { appendNpcEvent } from "@/core/usecases/append-npc-event";
import { retconAdventurerEvent } from "@/core/usecases/retcon-adventurer-event";
import { retconNpcEvent } from "@/core/usecases/retcon-npc-event";
import { createLooseEnd } from "@/core/usecases/create-loose-end";
import { createNpc } from "@/core/usecases/create-npc";
import { createSession } from "@/core/usecases/create-session";
import { createStoryPlan } from "@/core/usecases/create-story-plan";
import { getAdventureNpcRoster } from "@/core/usecases/get-adventure-npc-roster";
import { getAdventurerWithTimeline } from "@/core/usecases/get-adventurer-timeline";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import { getNpcWithTimeline } from "@/core/usecases/get-npc-timeline";
import {
  getStoryPlan,
  getStoryPlans,
} from "@/core/usecases/get-story-plans";
import { markNpcSeenByAdventurers } from "@/core/usecases/mark-npc-seen-by-adventurers";
import { updateAdventurer } from "@/core/usecases/update-adventurer";
import { updateLooseEnd } from "@/core/usecases/update-loose-end";
import { updateNpc } from "@/core/usecases/update-npc";
import { updateSession } from "@/core/usecases/update-session";
import { updateStoryPlan } from "@/core/usecases/update-story-plan";
import { upsertStoryPlanScene } from "@/core/usecases/upsert-story-plan-scene";
import { removeStoryPlanScene } from "@/core/usecases/remove-story-plan-scene";
import { reorderStoryPlanScenes } from "@/core/usecases/reorder-story-plan-scenes";
import { upsertSessionTimelineEntry } from "@/core/usecases/upsert-session-timeline-entry";
import { removeSessionTimelineEntry } from "@/core/usecases/remove-session-timeline-entry";
import { reorderSessionTimelineEntries } from "@/core/usecases/reorder-session-timeline-entries";
import { upsertSessionParticipant } from "@/core/usecases/upsert-session-participant";
import { removeSessionParticipant } from "@/core/usecases/remove-session-participant";
import {
  buildAdventurerEventInput,
  buildAdventurerInput,
  buildAdventurerPatch,
  initialLevelFromBody,
  buildLooseEndInput,
  buildLooseEndPatch,
  buildNpcEventInput,
  buildNpcInput,
  buildNpcPatch,
  buildSessionInput,
  buildSessionPatch,
  buildStoryNoteInput,
  buildStoryPlanInput,
  buildStoryPlanPatch,
  normalizeParticipant,
  normalizeScene,
  normalizeTimelineEntry,
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

/** Remove masterNotes de um Npc antes de expor via MCP sem token. */
function stripNpcMasterFields(npc: Npc) {
  const { masterNotes: _omit, ...safe } = npc;
  return safe;
}

/** Resolve o adventureId de uma sessão pelo sessionId quando não informado. */
async function resolveSessionAdventureId(
  repos: ReturnType<typeof getRepositories>,
  guildId: string,
  sessionId: string,
  providedAdventureId?: string,
): Promise<string> {
  if (providedAdventureId) return providedAdventureId;
  const guild = await getFullGuild(repos, guildId);
  const owner = guild?.adventures.find((a) =>
    a.sessions.some((s) => s.id === sessionId),
  );
  if (!owner) throw new Error(`Sessão "${sessionId}" não encontrada.`);
  return owner.adventure.id;
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
  /**
   * `authorized` indica se a chamada trouxe um MCP_SERVICE_TOKEN válido,
   * mesmo em tools de leitura liberada (requiresAuth: false) — usado para
   * decidir se campos sigilosos (masterNotes, eventos visibility: "master")
   * entram na resposta.
   */
  run: (args: Record<string, any>, authorized: boolean) => Promise<unknown>;
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
    id: {
      type: "string",
      description: "Id local, estável, usado para editar/remover/reordenar via MCP.",
    },
    title: { type: "string" },
    body: { type: "string" },
    icon: { type: "string" },
    callout: { type: "string" },
  },
  required: ["id", "title", "body", "icon"],
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

const adventurerSnapshotSchema = {
  type: "object",
  description:
    "Projeção derivada da timeline de eventos — nunca editada à mão (ver appendAdventurerEvent).",
  properties: {
    classes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          className: { type: "string" },
          levels: { type: "number" },
        },
      },
    },
    totalLevel: { type: "number" },
    status: { type: "string", enum: ["active", "dead", "missing", "retired"] },
    state: {
      type: "string",
      enum: ["normal", "suspicious", "fallen", "new"],
    },
    sheetUrl: { type: "string" },
    inventory: { type: "array", items: { type: "object" } },
    titles: { type: "array", items: { type: "string" } },
    lastSeenSessionId: { type: "string" },
    lastEventAt: { type: "string" },
    eventCount: { type: "number" },
  },
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
    background: { type: "string" },
    goal: { type: "string" },
    sheetUrl: { type: "string" },
    snapshot: adventurerSnapshotSchema,
  },
  required: [
    "id",
    "guildId",
    "adventureId",
    "name",
    "className",
    "icon",
    "background",
    "sheetUrl",
  ],
};

const adventurerEventSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    adventureId: { type: "string" },
    sessionId: { type: ["string", "null"] },
    actorId: { type: "string" },
    targetIds: { type: "array", items: { type: "string" } },
    participantIds: { type: "array", items: { type: "string" } },
    occurredAt: { type: "string" },
    type: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    visibility: { type: "string", enum: ["player", "master"] },
  },
  required: ["id", "adventureId", "actorId", "participantIds", "occurredAt", "type", "title"],
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
    masterNotes: {
      type: "string",
      description: "Só presente quando chamado com MCP_SERVICE_TOKEN.",
    },
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

/* ---- NPC / Boss ---------------------------------------------------------- */

const npcStatsSchema = {
  type: "object",
  properties: {
    classOrType: { type: "string" },
    level: { type: "number" },
    pv: { type: "number" },
    pm: { type: "number" },
    defesa: { type: "number" },
    resistencias: { type: "array", items: { type: "string" } },
    imunidades: { type: "array", items: { type: "string" } },
    atributos: {
      type: "object",
      properties: {
        for: { type: "number" },
        des: { type: "number" },
        con: { type: "number" },
        int: { type: "number" },
        sab: { type: "number" },
        car: { type: "number" },
      },
    },
    ataques: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          bonus: { type: "string" },
          damage: {
            type: "array",
            description:
              "Componentes de dano somados (ex.: 1d6 cortante + 1d6 ácido).",
            items: {
              type: "object",
              properties: {
                dado: { type: "string" },
                tipo: { type: "string" },
              },
              required: ["dado"],
            },
          },
          critico: { type: "string" },
        },
        required: ["name"],
      },
    },
    pericias: {
      type: "array",
      description: "Bônus já calculado (treino + atributo), com o atributo de referência.",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          atributo: { type: "string", enum: ["for", "des", "con", "int", "sab", "car"] },
          bonus: { type: "number" },
        },
        required: ["nome", "bonus"],
      },
    },
    habilidades: {
      type: "array",
      description: "Habilidades especiais com o impacto/dano que causam, quando aplicável.",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          efeito: { type: "string" },
        },
        required: ["nome"],
      },
    },
    magias: {
      type: "array",
      description:
        "Magias com tipo (escola), área de efeito e a forma de esquivar (teste de resistência).",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          tipo: { type: "string", description: "Escola/tipo da magia (ex.: Evocação)." },
          area: { type: "string", description: "Forma e alcance da área de efeito (ex.: Cone 9m)." },
          resistencia: {
            type: "object",
            description: "Teste de resistência que define a forma de esquivar da magia.",
            properties: {
              atributo: { type: "string", enum: ["for", "des", "con", "int", "sab", "car"] },
              cd: { type: "number" },
              sucesso: { type: "string", description: "Efeito se o teste passar." },
              falha: { type: "string", description: "Efeito se o teste falhar." },
            },
          },
          efeito: { type: "string", description: "Efeito/dano geral da magia." },
        },
        required: ["nome"],
      },
    },
  },
  required: ["classOrType", "pv", "defesa"],
};

const npcSnapshotSchema = {
  type: "object",
  description:
    "Projeção derivada da timeline de NpcEvent — nunca editada à mão (ver appendNpcEvent).",
  properties: {
    status: {
      type: "string",
      enum: ["alive", "dead", "revived", "missing", "unknown"],
    },
    inventory: { type: "array", items: { type: "object" } },
    seenByAdventurerIds: { type: "array", items: { type: "string" } },
    appearedInSessionIds: { type: "array", items: { type: "string" } },
    lastEventAt: { type: "string" },
    eventCount: { type: "number" },
  },
};

/** Npc sem masterNotes — uso sem MCP_SERVICE_TOKEN. */
const npcSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    guildId: { type: "string" },
    adventureId: { type: "string" },
    arcId: { type: "string" },
    kind: { type: "string", enum: ["npc", "boss"] },
    name: { type: "string" },
    icon: { type: "string" },
    role: { type: "string" },
    description: { type: "string" },
    masterNotes: {
      type: "string",
      description: "Só presente quando chamado com MCP_SERVICE_TOKEN.",
    },
    stats: npcStatsSchema,
    sheetUrl: { type: "string" },
    snapshot: npcSnapshotSchema,
  },
  required: ["id", "guildId", "adventureId", "kind", "name", "description"],
};

const npcEventSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    adventureId: { type: "string" },
    sessionId: { type: ["string", "null"] },
    npcId: { type: "string" },
    participantIds: { type: "array", items: { type: "string" } },
    occurredAt: { type: "string" },
    type: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    visibility: { type: "string", enum: ["player", "master"] },
  },
  required: ["id", "adventureId", "npcId", "occurredAt", "type", "title"],
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
        timeline: { type: "array", items: timelineEntrySchema },
        tags: { type: "array", items: tagSchema },
        participants: { type: "array", items: participantSchema },
        looseEndIds: { type: "array", items: { type: "string" } },
        closing: closingSchema,
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
        timeline: { type: "array", items: timelineEntrySchema },
        tags: { type: "array", items: tagSchema },
        participants: { type: "array", items: participantSchema },
        looseEndIds: { type: "array", items: { type: "string" } },
        closing: closingSchema,
      },
      required: ["sessionId"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();

      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );

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
    name: "upsertSessionTimelineEntry",
    description:
      "Insere ou atualiza UMA entrada da timeline de uma sessão, sem precisar reenviar o array `timeline` inteiro. Se `entry.id` já existir na sessão, a entrada é substituída no lugar (ou movida, se `position` for informado); senão é inserida como nova. `position` (índice 0-based) permite inserir/mover a entrada em qualquer ordem — se omitido, entradas novas vão para o fim. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        entry: timelineEntrySchema,
        position: {
          type: "number",
          description:
            "Índice 0-based onde a entrada deve entrar. Omitido = fim da lista (entrada nova) ou posição atual (entrada existente).",
        },
      },
      required: ["sessionId", "entry"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );
      const entry = normalizeTimelineEntry(args.entry ?? {});
      const position =
        args.position === undefined ? undefined : Number(args.position);
      const updated = await upsertSessionTimelineEntry(
        repos,
        guildId,
        adventureId,
        sessionId,
        entry,
        position,
      );
      return stripMasterNotes(updated);
    },
  },
  {
    name: "removeSessionTimelineEntry",
    description:
      "Remove uma entrada da timeline de uma sessão pelo seu id. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        entryId: { type: "string" },
      },
      required: ["sessionId", "entryId"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );
      const entryId = String(args.entryId);
      const updated = await removeSessionTimelineEntry(
        repos,
        guildId,
        adventureId,
        sessionId,
        entryId,
      );
      return stripMasterNotes(updated);
    },
  },
  {
    name: "reorderSessionTimelineEntries",
    description:
      "Reordena as entradas da timeline de uma sessão a partir de uma lista de ids na ordem desejada (não precisa incluir todas; as omitidas mantêm sua ordem relativa ao final). Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        entryIds: { type: "array", items: { type: "string" } },
      },
      required: ["sessionId", "entryIds"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );
      const entryIds = Array.isArray(args.entryIds)
        ? args.entryIds.map(String)
        : [];
      const updated = await reorderSessionTimelineEntries(
        repos,
        guildId,
        adventureId,
        sessionId,
        entryIds,
      );
      return stripMasterNotes(updated);
    },
  },
  {
    name: "upsertSessionParticipant",
    description:
      "Insere ou atualiza UM participante de uma sessão (chave: `adventurerId`), sem precisar reenviar o array `participants` inteiro. Se já existir um participante com o mesmo `adventurerId`, ele é substituído; senão é adicionado. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        participant: participantSchema,
      },
      required: ["sessionId", "participant"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );
      const participant = normalizeParticipant(args.participant ?? {});
      const updated = await upsertSessionParticipant(
        repos,
        guildId,
        adventureId,
        sessionId,
        participant,
      );
      return stripMasterNotes(updated);
    },
  },
  {
    name: "removeSessionParticipant",
    description:
      "Remove um participante de uma sessão pelo `adventurerId`. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
        adventurerId: { type: "string" },
      },
      required: ["sessionId", "adventurerId"],
    },
    outputSchema: sessionSchema,
    requiresAuth: true,
    run: async (args) => {
      const sessionId = String(args.sessionId);
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventureId = await resolveSessionAdventureId(
        repos,
        guildId,
        sessionId,
        args.adventureId ? String(args.adventureId) : undefined,
      );
      const adventurerId = String(args.adventurerId);
      const updated = await removeSessionParticipant(
        repos,
        guildId,
        adventureId,
        sessionId,
        adventurerId,
      );
      return stripMasterNotes(updated);
    },
  },
  {
    name: "getSessionNotes",
    description:
      "Lê as notas privadas do mestre (masterNotes) de uma sessão. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido pelo sessionId.",
        },
      },
      required: ["sessionId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        masterNotes: { type: "string" },
      },
      required: ["sessionId", "masterNotes"],
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

      const session = await repos.sessions.getById(
        guildId,
        adventureId,
        sessionId,
      );
      if (!session) throw new Error(`Sessão "${sessionId}" não encontrada.`);
      return { sessionId, masterNotes: session.masterNotes };
    },
  },
  {
    name: "createAdventurer",
    description:
      "Cria um aventureiro numa aventura e grava o evento `joined` que dá origem ao seu snapshot (nível/status/inventário). Cadastrado uma vez e depois referenciado (com badge próprio) em cada sessão. Não há campos de nível/status diretos — use appendAdventurerEvent (level_up, death, …) para evoluir o personagem depois de criado. Requer MCP_SERVICE_TOKEN.",
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
        level: {
          type: "number",
          description: "Nível inicial do evento `joined` (padrão 1) — não é um campo persistido na identidade.",
        },
        background: { type: "string" },
        goal: {
          type: "string",
          description: 'Motivação pessoal do personagem (ex.: "Vingar a família").',
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
      return createAdventurer(getRepositories(), input, initialLevelFromBody(args));
    },
  },
  {
    name: "appendAdventurerEvent",
    description:
      "Grava um evento na timeline de um aventureiro (joined, level_up, status_change, state_flag, item_gained, item_lost, relationship, injury, death, revival, title_badge, sheet_revision, story_beat) e recomputa seu snapshot (nível, status, inventário…). Eventos são append-only — não use para corrigir um evento já gravado, use retconAdventurerEvent. Para eventos cross-character (ex.: um soco), informe targetIds com os demais envolvidos; o evento aparece na timeline de todos eles. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        type: {
          type: "string",
          enum: [
            "joined",
            "level_up",
            "status_change",
            "state_flag",
            "item_gained",
            "item_lost",
            "relationship",
            "injury",
            "death",
            "revival",
            "title_badge",
            "sheet_revision",
            "story_beat",
          ],
        },
        actorId: {
          type: "string",
          description: "Aventureiro dono do evento (timeline principal).",
        },
        targetIds: {
          type: "array",
          items: { type: "string" },
          description: "Demais aventureiros envolvidos (evento cross-character único).",
        },
        sessionId: {
          type: "string",
          description: "Sessão onde o evento ocorreu. Omitir para backstory/entre-sessões.",
        },
        occurredAt: {
          type: "string",
          description: "Timestamp ISO real. Padrão: agora.",
        },
        title: { type: "string" },
        body: { type: "string" },
        visibility: {
          type: "string",
          enum: ["player", "master"],
          description: 'Padrão "player".',
        },
        relatedLooseEndIds: { type: "array", items: { type: "string" } },
      },
      required: ["adventureId", "type", "actorId", "title"],
      description:
        "Campos extras variam por `type` — ex.: level_up exige className/fromLevel/toLevel; item_gained exige item {id,name}; relationship exige nature; title_badge exige granted. Veja AdventurerEvent em core/entities/adventurer-event.ts.",
    },
    requiresAuth: true,
    run: async (args) => {
      const guildId = getMasterGuildId();
      const input = buildAdventurerEventInput(args, guildId);
      return appendAdventurerEvent(
        getRepositories(),
        guildId,
        input.adventureId,
        input,
      );
    },
  },
  {
    name: "retconAdventurerEvent",
    description:
      "Corrige um evento já gravado na timeline (append-only: nunca edita/apaga o original). Grava uma correção marcada com `retcons: targetEventId`; o evento original passa a ter `retconnedBy` e é ignorado na projeção do snapshot. Mesmos campos de appendAdventurerEvent, mais `targetEventId`. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        targetEventId: {
          type: "string",
          description: "Id do evento a corrigir.",
        },
        type: {
          type: "string",
          enum: [
            "joined",
            "level_up",
            "status_change",
            "state_flag",
            "item_gained",
            "item_lost",
            "relationship",
            "injury",
            "death",
            "revival",
            "title_badge",
            "sheet_revision",
            "story_beat",
          ],
        },
        actorId: { type: "string" },
        targetIds: { type: "array", items: { type: "string" } },
        sessionId: { type: "string" },
        occurredAt: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        visibility: { type: "string", enum: ["player", "master"] },
        relatedLooseEndIds: { type: "array", items: { type: "string" } },
      },
      required: ["adventureId", "targetEventId", "type", "actorId", "title"],
    },
    requiresAuth: true,
    run: async (args) => {
      const guildId = getMasterGuildId();
      const input = buildAdventurerEventInput(args, guildId);
      return retconAdventurerEvent(
        getRepositories(),
        guildId,
        input.adventureId,
        String(args.targetEventId),
        input,
      );
    },
  },
  {
    name: "getAdventurer",
    description:
      "Lê um aventureiro junto com sua timeline completa de eventos (joined, level_up, death…), ordenada cronologicamente. Útil para auditar como o snapshot atual (nível, status, inventário) foi construído.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: {
          type: "string",
          description: "Opcional; se omitido, é resolvido percorrendo as aventuras da guild.",
        },
        adventurerId: { type: "string" },
      },
      required: ["adventurerId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        adventurer: adventurerSchema,
        timeline: { type: "array", items: adventurerEventSchema },
      },
      required: ["adventurer", "timeline"],
    },
    requiresAuth: false,
    run: async (args) => {
      const guildId = getMasterGuildId();
      const repos = getRepositories();
      const adventurerId = String(args.adventurerId);

      let adventureId = args.adventureId ? String(args.adventureId) : "";
      if (!adventureId) {
        const guild = await getFullGuild(repos, guildId);
        const owner = guild?.adventures.find((a) =>
          a.adventurers.some((adv) => adv.id === adventurerId),
        );
        if (!owner) throw new Error(`Aventureiro "${adventurerId}" não encontrado.`);
        adventureId = owner.adventure.id;
      }

      return getAdventurerWithTimeline(repos, guildId, adventureId, adventurerId);
    },
  },
  {
    name: "updateAdventurer",
    description:
      "Atualiza a identidade de um aventureiro (name, className, icon, background, goal, sheetUrl). Nível e status NÃO são editáveis aqui — use appendAdventurerEvent (ex.: level_up, death) para mudar o que é derivado da timeline. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        adventurerId: { type: "string" },
        name: { type: "string" },
        className: { type: "string" },
        icon: { type: "string" },
        background: { type: "string" },
        goal: { type: "string" },
        sheetUrl: { type: "string" },
      },
      required: ["adventureId", "adventurerId"],
    },
    outputSchema: adventurerSchema,
    requiresAuth: true,
    run: async (args) => {
      const patch = buildAdventurerPatch(args);
      return updateAdventurer(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        String(args.adventurerId),
        patch,
      );
    },
  },
  {
    name: "createLooseEnd",
    description:
      "Cria um fio solto / gancho narrativo numa aventura (título/descrição públicos e masterNotes sigilosas). Sessões depois o referenciam via looseEndIds. Requer MCP_SERVICE_TOKEN.",
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
        masterNotes: {
          type: "string",
          description:
            "Notas privadas do mestre. Nunca aparece na página pública.",
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
    name: "updateLooseEnd",
    description:
      "Atualiza um fio solto existente (campos parciais, incl. masterNotes) — ex.: marcar `resolved: true` quando o gancho narrativo se resolve. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        looseEndId: { type: "string" },
        title: { type: "string" },
        category: { type: "string" },
        description: { type: "string" },
        color: { type: "string" },
        icon: { type: "string" },
        resolved: { type: "boolean" },
        masterNotes: {
          type: "string",
          description:
            "Notas privadas do mestre. Nunca aparece na página pública.",
        },
      },
      required: ["adventureId", "looseEndId"],
    },
    outputSchema: looseEndSchema,
    requiresAuth: true,
    run: async (args) => {
      const patch = buildLooseEndPatch(args);
      return updateLooseEnd(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        String(args.looseEndId),
        patch,
      );
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
    name: "upsertStoryPlanScene",
    description:
      "Insere ou atualiza UMA cena de um roteiro, sem precisar reenviar o array `scenes` inteiro. Se `scene.id` já existir no roteiro, a cena é substituída no lugar (ou movida, se `position` for informado); senão é inserida como nova. `position` (índice 0-based) permite inserir/mover a cena em qualquer ordem — se omitido, cenas novas vão para o fim. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
        scene: sceneSchema,
        position: {
          type: "number",
          description:
            "Índice 0-based onde a cena deve entrar. Omitido = fim da lista (cena nova) ou posição atual (cena existente).",
        },
      },
      required: ["storyPlanId", "adventureId", "scene"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const scene = normalizeScene(args.scene ?? {});
      const position =
        args.position === undefined ? undefined : Number(args.position);
      return upsertStoryPlanScene(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
        scene,
        position,
      );
    },
  },
  {
    name: "removeStoryPlanScene",
    description: "Remove uma cena de um roteiro pelo seu id. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
        sceneId: { type: "string" },
      },
      required: ["storyPlanId", "adventureId", "sceneId"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const sceneId = String(args.sceneId);
      return removeStoryPlanScene(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
        sceneId,
      );
    },
  },
  {
    name: "reorderStoryPlanScenes",
    description:
      "Reordena as cenas de um roteiro a partir de uma lista de ids na ordem desejada (não precisa incluir todas; as omitidas mantêm sua ordem relativa ao final). Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        storyPlanId: { type: "string" },
        adventureId: { type: "string" },
        sceneIds: { type: "array", items: { type: "string" } },
      },
      required: ["storyPlanId", "adventureId", "sceneIds"],
    },
    outputSchema: storyPlanSchema,
    requiresAuth: true,
    run: async (args) => {
      const storyPlanId = String(args.storyPlanId);
      const adventureId = String(args.adventureId);
      const sceneIds = Array.isArray(args.sceneIds)
        ? args.sceneIds.map(String)
        : [];
      return reorderStoryPlanScenes(
        getRepositories(),
        getMasterGuildId(),
        adventureId,
        storyPlanId,
        sceneIds,
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
  {
    name: "listNpcs",
    description:
      "Lista os NPCs/Bosses de uma aventura, com filtros opcionais por kind/status/seenByAdventurerId. Sem MCP_SERVICE_TOKEN, masterNotes nunca é incluída.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        kind: { type: "string", enum: ["npc", "boss"] },
        status: {
          type: "string",
          enum: ["alive", "dead", "revived", "missing", "unknown"],
        },
        seenByAdventurerId: {
          type: "string",
          description: "Restringe aos NPCs já vistos por este aventureiro.",
        },
      },
      required: ["adventureId"],
    },
    outputSchema: {
      type: "object",
      properties: { npcs: { type: "array", items: npcSchema } },
      required: ["npcs"],
    },
    requiresAuth: false,
    run: async (args, authorized) => {
      const npcs = await getAdventureNpcRoster(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        {
          kind: args.kind,
          status: args.status,
          seenByAdventurerId: args.seenByAdventurerId
            ? String(args.seenByAdventurerId)
            : undefined,
        },
      );
      return { npcs: authorized ? npcs : npcs.map(stripNpcMasterFields) };
    },
  },
  {
    name: "getNpc",
    description:
      "Lê um NPC/Boss junto com sua timeline de eventos. Sem MCP_SERVICE_TOKEN, masterNotes é omitida e a timeline traz só eventos visibility=player.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        npcId: { type: "string" },
      },
      required: ["adventureId", "npcId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        npc: npcSchema,
        timeline: { type: "array", items: npcEventSchema },
      },
      required: ["npc", "timeline"],
    },
    requiresAuth: false,
    run: async (args, authorized) => {
      const { npc, timeline } = await getNpcWithTimeline(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        String(args.npcId),
        authorized ? undefined : "player",
      );
      return { npc: authorized ? npc : stripNpcMasterFields(npc), timeline };
    },
  },
  {
    name: "createNpc",
    description:
      "Cria um NPC/Boss numa aventura (ficha Tormenta resumida, descrição pública e masterNotes sigilosas). Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        arcId: { type: "string" },
        kind: { type: "string", enum: ["npc", "boss"] },
        name: { type: "string" },
        icon: { type: "string" },
        role: { type: "string" },
        description: { type: "string" },
        masterNotes: { type: "string" },
        stats: npcStatsSchema,
        sheetUrl: { type: "string" },
      },
      required: ["adventureId", "kind", "name", "description"],
    },
    outputSchema: npcSchema,
    requiresAuth: true,
    run: async (args) => {
      const input = buildNpcInput(args, getMasterGuildId());
      return createNpc(getRepositories(), input);
    },
  },
  {
    name: "updateNpc",
    description:
      "Atualiza a identidade de um NPC/Boss (campos parciais: name, role, description, masterNotes, stats, sheetUrl...). Status/inventário/aparições NÃO são editáveis aqui — use appendNpcEvent/markNpcSeen. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        npcId: { type: "string" },
        arcId: { type: "string" },
        kind: { type: "string", enum: ["npc", "boss"] },
        name: { type: "string" },
        icon: { type: "string" },
        role: { type: "string" },
        description: { type: "string" },
        masterNotes: { type: "string" },
        stats: npcStatsSchema,
        sheetUrl: { type: "string" },
      },
      required: ["adventureId", "npcId"],
    },
    outputSchema: npcSchema,
    requiresAuth: true,
    run: async (args) => {
      const patch = buildNpcPatch(args);
      return updateNpc(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        String(args.npcId),
        patch,
      );
    },
  },
  {
    name: "appendNpcEvent",
    description:
      "Grava um evento na timeline de um NPC/Boss (status_change, appearance, item_gained, item_lost, relationship, note) e recomputa seu snapshot (status, inventário, aparições). Eventos são append-only — para corrigir um já gravado, use retconNpcEvent. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        npcId: { type: "string" },
        type: {
          type: "string",
          enum: ["status_change", "appearance", "item_gained", "item_lost", "relationship", "note"],
        },
        sessionId: {
          type: "string",
          description: "Sessão onde o evento ocorreu. Omitir para histórico/preparação.",
        },
        occurredAt: { type: "string", description: "Timestamp ISO real. Padrão: agora." },
        title: { type: "string" },
        body: { type: "string" },
        visibility: { type: "string", enum: ["player", "master"], description: 'Padrão "player".' },
      },
      required: ["adventureId", "npcId", "type", "title"],
      description:
        "Campos extras variam por `type` — ex.: status_change exige from/to; appearance exige sessionId/seenByAdventurerIds; item_gained exige item {id,name}; relationship exige nature. Veja NpcEvent em core/entities/npc-event.ts.",
    },
    requiresAuth: true,
    run: async (args) => {
      const guildId = getMasterGuildId();
      const input = buildNpcEventInput(args, guildId);
      return appendNpcEvent(getRepositories(), guildId, input.adventureId, input);
    },
  },
  {
    name: "markNpcSeen",
    description:
      "Marca que um NPC/Boss apareceu numa sessão e foi visto por um conjunto de aventureiros — atalho para appendNpcEvent(type: appearance). É o que dá aos jogadores acesso à ficha pública do NPC. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        npcId: { type: "string" },
        sessionId: { type: "string" },
        seenByAdventurerIds: { type: "array", items: { type: "string" } },
      },
      required: ["adventureId", "npcId", "sessionId", "seenByAdventurerIds"],
    },
    outputSchema: npcEventSchema,
    requiresAuth: true,
    run: async (args) => {
      return markNpcSeenByAdventurers(
        getRepositories(),
        getMasterGuildId(),
        String(args.adventureId),
        String(args.npcId),
        String(args.sessionId),
        Array.isArray(args.seenByAdventurerIds)
          ? args.seenByAdventurerIds.map(String)
          : [],
      );
    },
  },
  {
    name: "retconNpcEvent",
    description:
      "Corrige um evento já gravado na timeline de um NPC/Boss (append-only). Mesmos campos de appendNpcEvent, mais `targetEventId`. Requer MCP_SERVICE_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        adventureId: { type: "string" },
        npcId: { type: "string" },
        targetEventId: { type: "string", description: "Id do evento a corrigir." },
        type: {
          type: "string",
          enum: ["status_change", "appearance", "item_gained", "item_lost", "relationship", "note"],
        },
        sessionId: { type: "string" },
        occurredAt: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        visibility: { type: "string", enum: ["player", "master"] },
      },
      required: ["adventureId", "npcId", "targetEventId", "type", "title"],
    },
    requiresAuth: true,
    run: async (args) => {
      const guildId = getMasterGuildId();
      const input = buildNpcEventInput(args, guildId);
      return retconNpcEvent(
        getRepositories(),
        guildId,
        input.adventureId,
        String(args.targetEventId),
        input,
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
      const authorized = isMcpWriteAuthorized(req, pathToken);
      if (tool.requiresAuth && !authorized) {
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
        const out = await tool.run(args, authorized);
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
