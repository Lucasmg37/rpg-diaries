import type {
  AdventurerEvent,
  AdventurerSnapshot,
} from "@/core/entities/adventurer-event";

/**
 * Reduz o log de eventos de um aventureiro (onde ele é o dono = actorId) no
 * snapshot vigente. Puro e determinístico: o mesmo log sempre produz o mesmo
 * snapshot, então o snapshot persistido é só um cache descartável.
 */
export function projectSnapshot(events: AdventurerEvent[]): AdventurerSnapshot {
  const ordered = [...events]
    .filter((e) => !e.retconnedBy)
    .sort((a, b) =>
      a.occurredAt === b.occurredAt
        ? (a.sequence ?? 0) - (b.sequence ?? 0)
        : a.occurredAt.localeCompare(b.occurredAt),
    );

  const snap: AdventurerSnapshot = {
    classes: [],
    totalLevel: 0,
    status: "active",
    state: "normal",
    inventory: [],
    titles: [],
    eventCount: ordered.length,
  };

  for (const e of ordered) {
    switch (e.type) {
      case "joined":
        snap.classes = e.initialClasses.map((c) => ({ ...c }));
        break;
      case "level_up": {
        const cls = snap.classes.find((c) => c.className === e.className);
        if (cls) cls.levels += 1;
        else snap.classes.push({ className: e.className, levels: 1 });
        break;
      }
      case "status_change":
        snap.status = e.to;
        break;
      case "state_flag":
        snap.state = e.to;
        break;
      case "item_gained":
        snap.inventory.push(e.item);
        break;
      case "item_lost":
        snap.inventory = snap.inventory.filter((i) => i.id !== e.itemId);
        break;
      case "death":
        snap.status = "dead";
        snap.state = "fallen";
        break;
      case "revival":
        snap.status = "active";
        snap.state = "normal";
        break;
      case "title_badge":
        snap.titles = e.granted
          ? [...snap.titles, e.title]
          : snap.titles.filter((t) => t !== e.title);
        break;
      case "sheet_revision":
        snap.sheetUrl = e.sheetUrl;
        break;
      // injury / relationship / story_beat: aparecem na timeline, não mexem no snapshot.
    }
    snap.totalLevel = snap.classes.reduce((s, c) => s + c.levels, 0);
    snap.lastEventAt = e.occurredAt;
    if (e.sessionId) snap.lastSeenSessionId = e.sessionId;
  }

  return snap;
}
