"use client";

import { useState } from "react";

import {
  Alert,
  Button,
  CheckboxOption,
  Field,
  Select,
  TextArea,
} from "@/components/ui";
import type { Adventurer } from "@/core/entities/adventurer";
import type { Npc } from "@/core/entities/npc";
import type { NpcEvent, NpcStatus } from "@/core/entities/npc-event";
import type { FullSession } from "@/core/entities/views";
import { sendJson } from "@/lib/admin-client";

type EventType = NpcEvent["type"];

const TYPE_LABELS: Record<EventType, string> = {
  status_change: "Mudou de status (vivo/morto/revivido…)",
  appearance: "Apareceu numa sessão",
  item_gained: "Ganhou um item",
  item_lost: "Perdeu um item",
  relationship: "Evento relacional",
  note: "Nota narrativa (sem efeito no snapshot)",
};

const NPC_STATUSES: NpcStatus[] = ["alive", "dead", "revived", "missing", "unknown"];

const EMPTY_EXTRA = {
  statusFrom: "alive" as NpcStatus,
  statusTo: "alive" as NpcStatus,
  cause: "",
  itemId: "",
  itemName: "",
  itemQuantity: 1,
  itemReason: "",
  nature: "alliance" as "alliance" | "conflict" | "bond" | "betrayal",
  seenByAdventurerIds: [] as string[],
};

export interface NpcEventFormInitial {
  type: EventType;
  title: string;
  body?: string;
  visibility: "player" | "master";
}

export function NpcEventForm({
  npc,
  adventureId,
  adventurers,
  sessions,
  onCreated,
  retconTargetId,
  initial,
  onCancel,
}: {
  npc: Npc;
  adventureId: string;
  adventurers: Adventurer[];
  sessions: FullSession[];
  onCreated: () => void;
  /** Quando presente, o evento criado corrige (retcon) este evento em vez de ser um lançamento novo. */
  retconTargetId?: string;
  initial?: NpcEventFormInitial;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<EventType>(initial?.type ?? "appearance");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState(
    initial ? `[Correção] ${initial.title}` : "",
  );
  const [body, setBody] = useState(initial?.body ?? "");
  const [visibility, setVisibility] = useState<"player" | "master">(
    initial?.visibility ?? "player",
  );
  const [extra, setExtra] = useState({ ...EMPTY_EXTRA });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleSeen(id: string) {
    setExtra((prev) => ({
      ...prev,
      seenByAdventurerIds: prev.seenByAdventurerIds.includes(id)
        ? prev.seenByAdventurerIds.filter((a) => a !== id)
        : [...prev.seenByAdventurerIds, id],
    }));
  }

  function reset() {
    setTitle("");
    setBody("");
    setVisibility("player");
    setExtra({ ...EMPTY_EXTRA });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      adventureId,
      type,
      sessionId: sessionId || null,
      title,
      body: body || undefined,
      visibility,
    };

    switch (type) {
      case "status_change":
        payload.from = extra.statusFrom;
        payload.to = extra.statusTo;
        payload.cause = extra.cause || undefined;
        break;
      case "appearance":
        payload.sessionId = sessionId;
        payload.seenByAdventurerIds = extra.seenByAdventurerIds;
        break;
      case "item_gained":
        payload.item = {
          id: extra.itemId || extra.itemName,
          name: extra.itemName,
          quantity: extra.itemQuantity > 1 ? extra.itemQuantity : undefined,
        };
        break;
      case "item_lost":
        payload.itemId = extra.itemId;
        payload.reason = extra.itemReason || undefined;
        break;
      case "relationship":
        payload.nature = extra.nature;
        break;
      case "note":
        break;
    }

    try {
      const url = retconTargetId
        ? `/api/admin/npcs/${npc.id}/events/${retconTargetId}/retcon`
        : `/api/admin/npcs/${npc.id}/events`;
      await sendJson(url, "POST", payload);
      reset();
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="npc-ev-type"
            label="Tipo de evento"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
          >
            {(Object.keys(TYPE_LABELS) as EventType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select
            id="npc-ev-session"
            label="Sessão"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">Nenhuma (histórico / preparação)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                Sessão {s.number} — {s.title}
              </option>
            ))}
          </Select>
          <Field
            id="npc-ev-title"
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            id="npc-ev-visibility"
            label="Visibilidade"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "player" | "master")}
          >
            <option value="player">Jogador (público)</option>
            <option value="master">Mestre (sigiloso)</option>
          </Select>
        </div>

        <TextArea
          id="npc-ev-body"
          label="Descrição"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {type === "status_change" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              id="npc-ev-status-from"
              label="De"
              value={extra.statusFrom}
              onChange={(e) =>
                setExtra({ ...extra, statusFrom: e.target.value as NpcStatus })
              }
            >
              {NPC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              id="npc-ev-status-to"
              label="Para"
              value={extra.statusTo}
              onChange={(e) =>
                setExtra({ ...extra, statusTo: e.target.value as NpcStatus })
              }
            >
              {NPC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Field
              id="npc-ev-cause"
              label="Causa (opcional)"
              value={extra.cause}
              onChange={(e) => setExtra({ ...extra, cause: e.target.value })}
            />
          </div>
        )}

        {type === "appearance" && (
          <div>
            <p className="font-heading text-[11px] uppercase tracking-wide text-guild-muted">
              Aventureiros que viram este NPC nesta sessão
            </p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {adventurers.map((a) => (
                <CheckboxOption
                  key={a.id}
                  checked={extra.seenByAdventurerIds.includes(a.id)}
                  onChange={() => toggleSeen(a.id)}
                >
                  {a.icon} {a.name}
                </CheckboxOption>
              ))}
            </div>
          </div>
        )}

        {type === "item_gained" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="npc-ev-item-name"
              label="Nome do item"
              value={extra.itemName}
              onChange={(e) => setExtra({ ...extra, itemName: e.target.value })}
            />
            <Field
              id="npc-ev-item-quantity"
              label="Quantidade"
              type="number"
              value={extra.itemQuantity}
              onChange={(e) =>
                setExtra({ ...extra, itemQuantity: Number(e.target.value) })
              }
            />
            <Field
              id="npc-ev-item-id"
              label="ID do item (opcional)"
              value={extra.itemId}
              onChange={(e) => setExtra({ ...extra, itemId: e.target.value })}
            />
          </div>
        )}

        {type === "item_lost" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="npc-ev-item-lost-id"
              label="ID do item"
              value={extra.itemId}
              onChange={(e) => setExtra({ ...extra, itemId: e.target.value })}
            />
            <Field
              id="npc-ev-item-reason"
              label="Motivo (opcional)"
              value={extra.itemReason}
              onChange={(e) => setExtra({ ...extra, itemReason: e.target.value })}
            />
          </div>
        )}

        {type === "relationship" && (
          <Select
            id="npc-ev-nature"
            label="Natureza"
            value={extra.nature}
            onChange={(e) =>
              setExtra({ ...extra, nature: e.target.value as typeof extra.nature })
            }
          >
            <option value="alliance">Aliança</option>
            <option value="conflict">Conflito</option>
            <option value="bond">Vínculo</option>
            <option value="betrayal">Traição</option>
          </Select>
        )}

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting
            ? "Gravando…"
            : retconTargetId
              ? "Gravar correção"
              : "Adicionar evento"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
