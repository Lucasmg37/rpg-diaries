import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createNpc } from "@/core/usecases/create-npc";
import { getAdventureNpcRoster } from "@/core/usecases/get-adventure-npc-roster";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildNpcInput } from "@/lib/admin-serializers";

/** GET /api/admin/npcs?adventureId= — lista os NPCs/Bosses de uma aventura. */
export async function GET(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const adventureId = req.nextUrl.searchParams.get("adventureId");
  if (!adventureId) {
    return NextResponse.json(
      { error: "Parâmetro adventureId é obrigatório." },
      { status: 400 },
    );
  }

  try {
    const npcs = await getAdventureNpcRoster(
      getRepositories(),
      getMasterGuildId(),
      adventureId,
    );
    return NextResponse.json(npcs);
  } catch (e) {
    return apiError(e);
  }
}

/** POST /api/admin/npcs — cria um NPC/Boss. */
export async function POST(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || body.adventureId == null) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const created = await createNpc(
      getRepositories(),
      buildNpcInput(body, getMasterGuildId()),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
