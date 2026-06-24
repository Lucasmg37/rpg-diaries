import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { retconNpcEvent } from "@/core/usecases/retcon-npc-event";
import { apiError } from "@/lib/api-response";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { buildNpcEventInput } from "@/lib/admin-serializers";

/**
 * POST /api/admin/npcs/[id]/events/[eventId]/retcon — corrige um evento já
 * gravado (append-only: grava uma correção, nunca edita/apaga o original).
 * `npcId` da correção = id da rota (mesmo dono do evento original).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  if (!(await getMasterSession(req))) return unauthorized();

  const { id, eventId } = await params;
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || body.adventureId == null) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const guildId = getMasterGuildId();
  const adventureId = String(body.adventureId);
  const correction = buildNpcEventInput({ ...body, npcId: id }, guildId);

  try {
    const created = await retconNpcEvent(
      getRepositories(),
      guildId,
      adventureId,
      eventId,
      correction,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
