import type { NpcEvent, NpcSnapshot } from "@/core/entities/npc-event";

/**
 * Reduz o log de eventos de um NPC no snapshot vigente. Puro e
 * determinístico — espelha project-snapshot.ts (Adventurer).
 */
export function projectNpcSnapshot(events: NpcEvent[]): NpcSnapshot {
  const ordered = [...events]
    .filter((e) => !e.retconnedBy)
    .sort((a, b) =>
      a.occurredAt === b.occurredAt
        ? (a.sequence ?? 0) - (b.sequence ?? 0)
        : a.occurredAt.localeCompare(b.occurredAt),
    );

  const snap: NpcSnapshot = {
    status: "alive",
    inventory: [],
    seenByAdventurerIds: [],
    appearedInSessionIds: [],
    eventCount: ordered.length,
  };

  for (const e of ordered) {
    switch (e.type) {
      case "status_change":
        snap.status = e.to;
        break;
      case "appearance":
        snap.seenByAdventurerIds = Array.from(
          new Set([...snap.seenByAdventurerIds, ...e.seenByAdventurerIds]),
        );
        snap.appearedInSessionIds = Array.from(
          new Set([...snap.appearedInSessionIds, e.sessionId]),
        );
        break;
      case "item_gained":
        snap.inventory.push(e.item);
        break;
      case "item_lost":
        snap.inventory = snap.inventory.filter((i) => i.id !== e.itemId);
        break;
      // relationship / note: aparecem na timeline, não mexem no snapshot.
    }
    snap.lastEventAt = e.occurredAt;
  }

  return snap;
}
