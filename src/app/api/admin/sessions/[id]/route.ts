import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import type { UpdateSessionInput } from "@/core/entities/session";
import { updateSession } from "@/core/usecases/update-session";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { buildSessionInput } from "@/lib/admin-serializers";

/** PATCH /api/admin/sessions/[id] — atualiza uma sessão (requer adventureId no corpo). */
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
  // Reaproveita o builder e descarta os campos imutáveis para formar o patch.
  const { guildId: _g, adventureId: _a, ...patch } = buildSessionInput(
    body,
    guildId,
  );

  try {
    const updated = await updateSession(
      getRepositories(),
      guildId,
      adventureId,
      id,
      patch as UpdateSessionInput,
    );
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
