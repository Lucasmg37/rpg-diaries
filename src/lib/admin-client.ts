import type { StoryPlan } from "@/core/entities/story-plan";
import type { FullGuild } from "@/core/entities/views";

/**
 * Helpers client-side para a área de gestão. As datas vêm serializadas como
 * string no JSON, mas a UI não as manipula — só lê campos escalares/arrays.
 */

export async function getAdminGuild(): Promise<FullGuild> {
  const res = await fetch("/api/admin/guild");
  if (!res.ok) throw new Error("Não autorizado ou guild indisponível.");
  return res.json();
}

/** Lista os roteiros do mestre de uma aventura (área logada). */
export async function listStoryPlans(
  adventureId: string,
): Promise<StoryPlan[]> {
  const res = await fetch(
    `/api/admin/story-plans?adventureId=${encodeURIComponent(adventureId)}`,
  );
  if (!res.ok) throw new Error("Não autorizado ou roteiros indisponíveis.");
  return res.json();
}

/** Obtém um roteiro do mestre pelo id (requer adventureId). */
export async function getStoryPlan(
  adventureId: string,
  id: string,
): Promise<StoryPlan> {
  const res = await fetch(
    `/api/admin/story-plans/${id}?adventureId=${encodeURIComponent(adventureId)}`,
  );
  if (!res.ok) throw new Error("Roteiro indisponível.");
  return res.json();
}

export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Erro ${res.status}.`);
  }
  return res.json();
}
