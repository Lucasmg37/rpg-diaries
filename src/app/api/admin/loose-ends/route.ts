import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { createLooseEnd } from "@/core/usecases/create-loose-end";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { buildLooseEndInput } from "@/lib/admin-serializers";

/** POST /api/admin/loose-ends — cria um fio solto. */
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
    const created = await createLooseEnd(
      getRepositories(),
      buildLooseEndInput(body, getMasterGuildId()),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
