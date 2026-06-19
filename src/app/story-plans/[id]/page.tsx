import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StoryPlanViewer } from "@/components/admin/StoryPlanViewer";
import { Alert } from "@/components/ui";
import { SESSION_COOKIE, verifyMasterToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

/**
 * Visualizador do roteiro do mestre, no padrão visual das páginas públicas
 * (ex.: /sessions/[id]) — mas sigiloso: exige sessão de mestre válida no
 * cookie, verificada no servidor antes de renderizar.
 */
export default async function StoryPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adventureId?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyMasterToken(token) : null;
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const { adventureId } = await searchParams;

  return (
    <div className="space-y-8">
      <p>
        <Link
          href="/admin/management/story-plans"
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← Roteiros
        </Link>
      </p>

      {!adventureId ? (
        <Alert tone="error">Parâmetro adventureId ausente.</Alert>
      ) : (
        <StoryPlanViewer storyPlanId={id} adventureId={adventureId} />
      )}
    </div>
  );
}
