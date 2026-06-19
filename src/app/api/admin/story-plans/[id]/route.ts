import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { getStoryPlan } from "@/core/usecases/get-story-plans";
import { updateStoryPlan } from "@/core/usecases/update-story-plan";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildStoryPlanPatch } from "@/lib/admin-serializers";

/**
 * GET /api/admin/story-plans/[id]?adventureId= — obtém um roteiro (para o
 * visualizador). SIGILOSO: exige sessão de mestre.
 */
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
    const plan = await getStoryPlan(
      getRepositories(),
      getMasterGuildId(),
      adventureId,
      id,
    );
    if (!plan) {
      return NextResponse.json(
        { error: "Roteiro não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json(plan);
  } catch (e) {
    return apiError(e);
  }
}

/** PATCH /api/admin/story-plans/[id] — atualiza um roteiro (requer adventureId). */
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
  const patch = buildStoryPlanPatch(body);

  try {
    const updated = await updateStoryPlan(
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
