import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { UpdateAdventurerInput } from "@/core/entities/adventurer";
import { updateAdventurer } from "@/core/usecases/update-adventurer";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildAdventurerInput } from "@/lib/admin-serializers";

/** PATCH /api/admin/adventurers/[id] — atualiza um aventureiro (requer adventureId). */
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
  const { guildId: _g, adventureId: _a, ...patch } = buildAdventurerInput(
    body,
    guildId,
  );

  try {
    const updated = await updateAdventurer(
      getRepositories(),
      guildId,
      adventureId,
      id,
      patch as UpdateAdventurerInput,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
