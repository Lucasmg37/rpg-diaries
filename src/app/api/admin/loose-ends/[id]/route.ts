import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { UpdateLooseEndInput } from "@/core/entities/loose-end";
import { updateLooseEnd } from "@/core/usecases/update-loose-end";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildLooseEndInput } from "@/lib/admin-serializers";

/** PATCH /api/admin/loose-ends/[id] — atualiza um fio solto (requer adventureId). */
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
  const { guildId: _g, adventureId: _a, ...patch } = buildLooseEndInput(
    body,
    guildId,
  );

  try {
    const updated = await updateLooseEnd(
      getRepositories(),
      guildId,
      adventureId,
      id,
      patch as UpdateLooseEndInput,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
