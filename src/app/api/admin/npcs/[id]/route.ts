import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { deleteNpc } from "@/core/usecases/delete-npc";
import { updateNpc } from "@/core/usecases/update-npc";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildNpcPatch } from "@/lib/admin-serializers";

/** GET /api/admin/npcs/[id]?adventureId= — lê um NPC/Boss (sem timeline). */
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
    const npc = await getRepositories().npcs.getById(
      getMasterGuildId(),
      adventureId,
      id,
    );
    if (!npc) {
      return NextResponse.json({ error: "NPC não encontrado." }, { status: 404 });
    }
    return NextResponse.json(npc);
  } catch (e) {
    return apiError(e);
  }
}

/** PATCH /api/admin/npcs/[id] — atualiza a identidade de um NPC/Boss (requer adventureId). */
export async function PATCH(
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
  const patch = buildNpcPatch(body);

  try {
    const updated = await updateNpc(
      getRepositories(),
      guildId,
      adventureId,
      id,
      patch,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

/** DELETE /api/admin/npcs/[id]?adventureId= — exclui um NPC/Boss. */
export async function DELETE(
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
    await deleteNpc(getRepositories(), getMasterGuildId(), adventureId, id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}
