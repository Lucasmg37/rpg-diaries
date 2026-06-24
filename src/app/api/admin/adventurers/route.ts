import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createAdventurer } from "@/core/usecases/create-adventurer";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildAdventurerInput, initialLevelFromBody } from "@/lib/admin-serializers";

/** POST /api/admin/adventurers — cria um aventureiro. */
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
    const created = await createAdventurer(
      getRepositories(),
      buildAdventurerInput(body, getMasterGuildId()),
      initialLevelFromBody(body),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
