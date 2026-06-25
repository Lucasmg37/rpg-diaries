import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { reorderAdventures } from "@/core/usecases/reorder-adventures";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";
import { apiError } from "@/lib/api-response";

/** POST /api/admin/adventures/reorder { ids: string[] } — define a nova ordem das aventuras. */
export async function POST(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    await reorderAdventures(getRepositories(), getMasterGuildId(), body.ids.map(String));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}
