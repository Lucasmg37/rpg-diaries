import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { UpdateAdventureInput } from "@/core/entities/adventure";
import { deleteAdventure } from "@/core/usecases/delete-adventure";
import { updateAdventure } from "@/core/usecases/update-adventure";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";
import { buildAdventurePatch } from "@/lib/admin-serializers";

/** PATCH /api/admin/adventures/[id] — atualiza nome/descrição/ordem de uma aventura. */
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
  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const guildId = getMasterGuildId();
  const patch = buildAdventurePatch(body);

  try {
    const updated = await updateAdventure(
      getRepositories(),
      guildId,
      id,
      patch as UpdateAdventureInput,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

/** DELETE /api/admin/adventures/[id] — exclui uma aventura (bloqueado se tiver conteúdo). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getMasterSession(req))) return unauthorized();

  const { id } = await params;

  try {
    await deleteAdventure(getRepositories(), getMasterGuildId(), id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}
