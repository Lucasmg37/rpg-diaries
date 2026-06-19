import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createSession } from "@/core/usecases/create-session";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { buildSessionInput } from "@/lib/admin-serializers";

/** POST /api/admin/sessions — cria uma sessão. */
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
    const created = await createSession(
      getRepositories(),
      buildSessionInput(body, getMasterGuildId()),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
