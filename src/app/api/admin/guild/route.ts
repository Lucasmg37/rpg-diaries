import { NextResponse, type NextRequest } from "next/server";

import { getMasterGuildId } from "@/adapters/config/master-config";
import { getRepositories } from "@/adapters/config/repository-factory";
import { getFullGuild } from "@/core/usecases/get-full-guild";
import { getMasterSession, unauthorized } from "@/lib/auth-middleware";

/**
 * GET /api/admin/guild — leitura completa da guild do master para a área de
 * gestão, INCLUINDO masterNotes (só acessível com sessão válida).
 */
export async function GET(req: NextRequest) {
  if (!(await getMasterSession(req))) return unauthorized();

  const guild = await getFullGuild(getRepositories(), getMasterGuildId(), {
    includeMasterNotes: true,
  });
  if (!guild) {
    return NextResponse.json({ error: "Guild não encontrada." }, { status: 404 });
  }
  return NextResponse.json(guild);
}
