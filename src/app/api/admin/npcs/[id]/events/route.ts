import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { appendNpcEvent } from "@/core/usecases/append-npc-event";
import { getNpcWithTimeline } from "@/core/usecases/get-npc-timeline";
import { apiError } from "@/lib/api-response";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { buildNpcEventInput } from "@/lib/admin-serializers";

/** GET /api/admin/npcs/[id]/events?adventureId= — NPC + timeline completa (sem filtro de visibility). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getMasterSession(req))) return unauthorized();

  const { id } = await params;
  const adventureId = req.nextUrl.searchParams.get("adventureId");
  if (!adventureId) {
    return NextResponse.json(
      { error: "Parâmetro adventureId é obrigatório." },
      { status: 400 },
    );
  }

  try {
    const result = await getNpcWithTimeline(
      getRepositories(),
      getMasterGuildId(),
      adventureId,
      id,
    );
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}

/** POST /api/admin/npcs/[id]/events — grava um evento (npcId = id da rota). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getMasterSession(req))) return unauthorized();

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || body.adventureId == null) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const guildId = getMasterGuildId();
  const adventureId = String(body.adventureId);
  const input = buildNpcEventInput({ ...body, npcId: id }, guildId);

  try {
    const created = await appendNpcEvent(
      getRepositories(),
      guildId,
      adventureId,
      input,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
