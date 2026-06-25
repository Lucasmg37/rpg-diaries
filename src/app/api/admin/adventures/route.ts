import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createAdventure } from "@/core/usecases/create-adventure";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildAdventureInput } from "@/lib/admin-serializers";

/** POST /api/admin/adventures — cria uma aventura (campanha) na guilda. */
export async function POST(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || !body.name) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const guildId = getMasterGuildId();
  const repos = getRepositories();

  try {
    if (body.order == null) {
      const existing = await repos.adventures.listByGuild(guildId);
      const maxOrder = existing.reduce((m, a) => Math.max(m, a.order), 0);
      body.order = maxOrder + 1;
    }
    const created = await createAdventure(repos, buildAdventureInput(body, guildId));
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
