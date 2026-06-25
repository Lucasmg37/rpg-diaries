import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { reorderStoryPlans } from "@/core/usecases/reorder-story-plans";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";

/** POST /api/admin/story-plans/reorder { adventureId, ids } — define a nova ordem dos roteiros. */
export async function POST(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const body = (await req.json().catch(() => null)) as
    | { adventureId?: unknown; ids?: unknown }
    | null;
  if (!body || !body.adventureId || !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    await reorderStoryPlans(
      getRepositories(),
      getMasterGuildId(),
      String(body.adventureId),
      body.ids.map(String),
    );
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}
