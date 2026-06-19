import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { addStoryNote } from "@/core/usecases/add-story-note";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildStoryNoteInput } from "@/lib/admin-serializers";

/**
 * POST /api/admin/story-plans/[id]/notes — lança uma nota viva no roteiro
 * durante o jogo (requer adventureId no corpo). Devolve o roteiro atualizado.
 */
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
  if (!body || body.adventureId == null || !body.body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const guildId = getMasterGuildId();
  const adventureId = String(body.adventureId);

  try {
    const updated = await addStoryNote(
      getRepositories(),
      guildId,
      adventureId,
      id,
      buildStoryNoteInput(body),
    );
    return NextResponse.json(updated, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
