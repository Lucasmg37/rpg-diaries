/**
 * Auto-teste do reducer projectSnapshot — sem framework de testes instalado,
 * roda como script e falha com exit(1) em caso de divergência.
 *
 * Rodar: npx tsx scripts/test-project-snapshot.ts
 */
import { projectSnapshot } from "@/core/usecases/project-snapshot";
import type { AdventurerEvent } from "@/core/entities/adventurer-event";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`❌ ${label}\n  esperado: ${e}\n  obtido:   ${a}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
}

const base = {
  guildId: "g1",
  adventureId: "a1",
  participantIds: [],
  visibility: "player" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const events: AdventurerEvent[] = [
  {
    ...base,
    id: "e1",
    type: "joined",
    actorId: "adv-1",
    occurredAt: "2026-01-01T00:00:00.000Z",
    title: "Entrou na crônica",
    initialClasses: [{ className: "Bárbaro", levels: 1 }],
  },
  {
    ...base,
    id: "e2",
    type: "level_up",
    actorId: "adv-1",
    occurredAt: "2026-01-02T00:00:00.000Z",
    title: "Subiu de nível",
    className: "Bárbaro",
    fromLevel: 1,
    toLevel: 2,
  },
  {
    ...base,
    id: "e3",
    type: "level_up",
    actorId: "adv-1",
    occurredAt: "2026-01-03T00:00:00.000Z",
    title: "Multiclasse",
    className: "Arcanista",
    fromLevel: 0,
    toLevel: 1,
  },
  {
    ...base,
    id: "e4",
    type: "state_flag",
    actorId: "adv-1",
    occurredAt: "2026-01-04T00:00:00.000Z",
    title: "Ficou suspeito",
    to: "suspicious",
  },
  {
    ...base,
    id: "e5",
    type: "item_gained",
    actorId: "adv-1",
    occurredAt: "2026-01-05T00:00:00.000Z",
    title: "Achou um item",
    item: { id: "item-1", name: "Espada" },
  },
  {
    ...base,
    id: "e6",
    type: "death",
    actorId: "adv-1",
    occurredAt: "2026-01-06T00:00:00.000Z",
    title: "Caiu em combate",
  },
];

const snap = projectSnapshot(events);

assertEqual(
  snap.classes,
  [
    { className: "Bárbaro", levels: 2 },
    { className: "Arcanista", levels: 1 },
  ],
  "multiclasse acumulada corretamente",
);
assertEqual(snap.totalLevel, 3, "totalLevel = soma das classes");
assertEqual(snap.status, "dead", "death sobrescreve status");
assertEqual(snap.state, "fallen", "death sobrescreve state para fallen");
assertEqual(snap.inventory, [{ id: "item-1", name: "Espada" }], "item_gained adiciona ao inventário");
assertEqual(snap.eventCount, 6, "eventCount = total de eventos não-retconados");

// revival depois da death restaura status/state
const revived = projectSnapshot([
  ...events,
  {
    ...base,
    id: "e7",
    type: "revival",
    actorId: "adv-1",
    occurredAt: "2026-01-07T00:00:00.000Z",
    title: "Ressuscitou",
  },
]);
assertEqual(revived.status, "active", "revival restaura status");
assertEqual(revived.state, "normal", "revival restaura state");

// retcon: evento marcado como retconnedBy é ignorado na projeção
const withRetcon = projectSnapshot([
  { ...events[1], retconnedBy: "fix-1" }, // o level_up original é descartado
  events[0],
  events[2],
]);
assertEqual(withRetcon.totalLevel, 2, "evento retconado é excluído da projeção");

// item_lost remove do inventário
const lostItem = projectSnapshot([
  ...events,
  {
    ...base,
    id: "e8",
    type: "item_lost",
    actorId: "adv-1",
    occurredAt: "2026-01-08T00:00:00.000Z",
    title: "Perdeu o item",
    itemId: "item-1",
  },
]);
assertEqual(lostItem.inventory, [], "item_lost remove do inventário");

// item_gained com quantity preserva a pilha no snapshot
const stackedItem = projectSnapshot([
  ...events,
  {
    ...base,
    id: "e9",
    type: "item_gained",
    actorId: "adv-1",
    occurredAt: "2026-01-09T00:00:00.000Z",
    title: "Achou poções",
    item: { id: "item-2", name: "Poção de Ácido", quantity: 3 },
  },
]);
assertEqual(
  stackedItem.inventory,
  [
    { id: "item-1", name: "Espada" },
    { id: "item-2", name: "Poção de Ácido", quantity: 3 },
  ],
  "item_gained com quantity preserva a pilha no inventário",
);

console.log("\n✅ Todos os testes de projectSnapshot passaram.");
