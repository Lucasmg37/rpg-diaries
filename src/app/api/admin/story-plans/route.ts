import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createStoryPlan } from "@/core/usecases/create-story-plan";
import { getStoryPlans } from "@/core/usecases/get-story-plans";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildStoryPlanInput } from "@/lib/admin-serializers";

/**
 * GET /api/admin/story-plans?adventureId= — lista os roteiros do mestre de uma
 * aventura. SIGILOSO: só acessível com sessão de mestre válida.
 */
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
    const plans = await getStoryPlans(
      getRepositories(),
      getMasterGuildId(),
      adventureId,
    );
    return NextResponse.json(plans);
  } catch (e) {
    return apiError(e);
  }
}

/** POST /api/admin/story-plans — cria um roteiro do mestre. */
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
    const created = await createStoryPlan(
      getRepositories(),
      buildStoryPlanInput(body, getMasterGuildId()),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
