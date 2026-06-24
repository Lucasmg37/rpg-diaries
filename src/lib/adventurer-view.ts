import type { Adventurer } from "@/core/entities/adventurer";

/**
 * Leitura de exibição do Adventurer. Desde a Fase 2 do event sourcing, todo
 * aventureiro tem `snapshot` desde a criação (via evento `joined` automático
 * em `createAdventurer`) — não há mais fallback para campo legado. Um
 * `snapshot` ausente só pode significar dado pré-migração não corrigido.
 */
export function adventurerLevel(a: Adventurer): number {
  return a.snapshot?.totalLevel ?? 0;
}

export function adventurerStatusLabel(a: Adventurer): string {
  return a.snapshot?.status === "dead" ? "Morto" : "Ativo";
}

export function isAdventurerDead(a: Adventurer): boolean {
  return a.snapshot?.status === "dead";
}

export function adventurerClassLabel(a: Adventurer): string {
  const classes = a.snapshot?.classes;
  if (!classes?.length) return a.className;
  if (classes.length === 1) return classes[0].className;
  return classes.map((c) => `${c.className} ${c.levels}`).join(" / ");
}

export function adventurerSheetUrl(a: Adventurer): string {
  return a.snapshot?.sheetUrl ?? a.sheetUrl;
}
