import type { Adventurer } from "@/core/entities/adventurer";
import type { AdventurerEvent } from "@/core/entities/adventurer-event";
import type { Npc } from "@/core/entities/npc";
import type { NpcEvent } from "@/core/entities/npc-event";
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

/** Exclui um roteiro do mestre (requer adventureId). */
export async function deleteStoryPlan(
  adventureId: string,
  id: string,
): Promise<void> {
  const res = await fetch(
    `/api/admin/story-plans/${id}?adventureId=${encodeURIComponent(adventureId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Erro ${res.status}.`);
  }
}

/** Aventureiro + timeline completa de eventos (área logada, requer adventureId). */
export async function getAdventurerTimeline(
  adventureId: string,
  adventurerId: string,
): Promise<{ adventurer: Adventurer; timeline: AdventurerEvent[] }> {
  const res = await fetch(
    `/api/admin/adventurers/${adventurerId}/events?adventureId=${encodeURIComponent(adventureId)}`,
  );
  if (!res.ok) throw new Error("Não autorizado ou timeline indisponível.");
  return res.json();
}

/** Lista os NPCs/Bosses de uma aventura (área logada). */
export async function listAdminNpcs(adventureId: string): Promise<Npc[]> {
  const res = await fetch(
    `/api/admin/npcs?adventureId=${encodeURIComponent(adventureId)}`,
  );
  if (!res.ok) throw new Error("Não autorizado ou NPCs indisponíveis.");
  return res.json();
}

/** NPC/Boss + timeline completa de eventos (área logada, requer adventureId). */
export async function getNpcTimeline(
  adventureId: string,
  npcId: string,
): Promise<{ npc: Npc; timeline: NpcEvent[] }> {
  const res = await fetch(
    `/api/admin/npcs/${npcId}/events?adventureId=${encodeURIComponent(adventureId)}`,
  );
  if (!res.ok) throw new Error("Não autorizado ou timeline indisponível.");
  return res.json();
}

/** Exclui um NPC/Boss (requer adventureId). */
export async function deleteNpc(adventureId: string, id: string): Promise<void> {
  const res = await fetch(
    `/api/admin/npcs/${id}?adventureId=${encodeURIComponent(adventureId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Erro ${res.status}.`);
  }
}

/** Exclui uma sessão (requer adventureId). */
export async function deleteSession(
  adventureId: string,
  id: string,
): Promise<void> {
  const res = await fetch(
    `/api/admin/sessions/${id}?adventureId=${encodeURIComponent(adventureId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Erro ${res.status}.`);
  }
}
