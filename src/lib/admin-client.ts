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
