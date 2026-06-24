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
import type {
  AdventurerEvent,
  AdventurerState,
  AdventurerStatus,
} from "@/core/entities/adventurer-event";
import type { FullSession } from "@/core/entities/views";
import { sendJson } from "@/lib/admin-client";

type EventType = AdventurerEvent["type"];

const TYPE_LABELS: Record<EventType, string> = {
  joined: "Entrou na crônica",
  level_up: "Subiu de nível",
  status_change: "Mudou de status",
  state_flag: "Mudou de estado (suspeito/caído/novo)",
  item_gained: "Ganhou um item",
  item_lost: "Perdeu um item",
  relationship: "Evento relacional (com outro aventureiro)",
  injury: "Ficou ferido",
  death: "Morreu",
  revival: "Foi revivido",
  title_badge: "Recebeu/perdeu um título",
  sheet_revision: "Atualizou a ficha",
  story_beat: "Momento narrativo (sem efeito mecânico)",
};

const ADVENTURER_STATUSES: AdventurerStatus[] = [
  "active",
  "dead",
  "missing",
  "retired",
];
const ADVENTURER_STATES: AdventurerState[] = [
  "normal",
  "suspicious",
  "fallen",
  "new",
];

const EMPTY_EXTRA = {
  className: "",
  fromLevel: 1,
  toLevel: 2,
  statusFrom: "active" as AdventurerStatus,
  statusTo: "active" as AdventurerStatus,
  stateTo: "normal" as AdventurerState,
  itemId: "",
  itemName: "",
  itemReason: "",
  nature: "alliance" as "alliance" | "conflict" | "bond" | "betrayal",
  severity: "minor" as "minor" | "grave" | "critical",
  cause: "",
  method: "",
  badgeTitle: "",
  granted: true,
  sheetUrl: "",
  sheetNote: "",
};

export interface AdventurerEventFormInitial {
  type: EventType;
  title: string;
  body?: string;
  visibility: "player" | "master";
}

export function AdventurerEventForm({
  adventurer,
  adventureId,
  otherAdventurers,
  sessions,
  onCreated,
  retconTargetId,
  initial,
  onCancel,
}: {
  adventurer: Adventurer;
  adventureId: string;
  otherAdventurers: Adventurer[];
  sessions: FullSession[];
  onCreated: () => void;
  /** Quando presente, o evento criado corrige (retcon) este evento em vez de ser um lançamento novo. */
  retconTargetId?: string;
  initial?: AdventurerEventFormInitial;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<EventType>(initial?.type ?? "level_up");
  const [sessionId, setSessionId] = useState("");
  const [title, setTitle] = useState(
    initial ? `[Correção] ${initial.title}` : "",
  );
  const [body, setBody] = useState(initial?.body ?? "");
  const [visibility, setVisibility] = useState<"player" | "master">(
    initial?.visibility ?? "player",
  );
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [extra, setExtra] = useState({ ...EMPTY_EXTRA });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleTarget(id: string) {
    setTargetIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function reset() {
    setTitle("");
    setBody("");
    setVisibility("player");
    setTargetIds([]);
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
      targetIds: targetIds.length ? targetIds : undefined,
    };

    switch (type) {
      case "joined":
        payload.initialClasses = [
          { className: extra.className, levels: extra.fromLevel },
        ];
        break;
      case "level_up":
        payload.className = extra.className;
        payload.fromLevel = extra.fromLevel;
        payload.toLevel = extra.toLevel;
        break;
      case "status_change":
        payload.from = extra.statusFrom;
        payload.to = extra.statusTo;
        break;
      case "state_flag":
        payload.to = extra.stateTo;
        break;
      case "item_gained":
        payload.item = { id: extra.itemId || extra.itemName, name: extra.itemName };
        break;
      case "item_lost":
        payload.itemId = extra.itemId;
        payload.reason = extra.itemReason || undefined;
        break;
      case "relationship":
        payload.nature = extra.nature;
        break;
      case "injury":
        payload.severity = extra.severity;
        break;
      case "death":
        payload.cause = extra.cause || undefined;
        break;
      case "revival":
        payload.method = extra.method || undefined;
        break;
      case "title_badge":
        payload.title = extra.badgeTitle || title;
        payload.granted = extra.granted;
        break;
      case "sheet_revision":
        payload.sheetUrl = extra.sheetUrl;
        payload.note = extra.sheetNote || undefined;
        break;
      case "story_beat":
        break;
    }

    try {
      const url = retconTargetId
        ? `/api/admin/adventurers/${adventurer.id}/events/${retconTargetId}/retcon`
        : `/api/admin/adventurers/${adventurer.id}/events`;
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
            id="ev-type"
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
            id="ev-session"
            label="Sessão"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">Nenhuma (backstory / entre sessões)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                Sessão {s.number} — {s.title}
              </option>
            ))}
          </Select>
          <Field
            id="ev-title"
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select
            id="ev-visibility"
            label="Visibilidade"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "player" | "master")}
          >
            <option value="player">Jogador (público)</option>
            <option value="master">Mestre (sigiloso)</option>
          </Select>
        </div>

        <TextArea
          id="ev-body"
          label="Descrição"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {otherAdventurers.length > 0 ? (
          <div className="text-left">
            <p className="font-heading text-[11px] uppercase tracking-wide text-guild-muted">
              Outros envolvidos (evento cross-character)
            </p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {otherAdventurers.map((a) => (
                <CheckboxOption
                  key={a.id}
                  checked={targetIds.includes(a.id)}
                  onChange={() => toggleTarget(a.id)}
                >
                  {a.icon} {a.name}
                </CheckboxOption>
              ))}
            </div>
          </div>
        ) : null}

        {/* Campos específicos por tipo */}
        {(type === "joined" || type === "level_up") && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="ev-classname"
              label="Classe"
              value={extra.className}
              onChange={(e) => setExtra({ ...extra, className: e.target.value })}
            />
            <Field
              id="ev-fromlevel"
              label={type === "joined" ? "Nível inicial" : "De"}
              type="number"
              value={extra.fromLevel}
              onChange={(e) =>
                setExtra({ ...extra, fromLevel: Number(e.target.value) })
              }
            />
            {type === "level_up" ? (
              <Field
                id="ev-tolevel"
                label="Para"
                type="number"
                value={extra.toLevel}
                onChange={(e) =>
                  setExtra({ ...extra, toLevel: Number(e.target.value) })
                }
              />
            ) : null}
          </div>
        )}

        {type === "status_change" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="ev-status-from"
              label="De"
              value={extra.statusFrom}
              onChange={(e) =>
                setExtra({ ...extra, statusFrom: e.target.value as AdventurerStatus })
              }
            >
              {ADVENTURER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              id="ev-status-to"
              label="Para"
              value={extra.statusTo}
              onChange={(e) =>
                setExtra({ ...extra, statusTo: e.target.value as AdventurerStatus })
              }
            >
              {ADVENTURER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        )}

        {type === "state_flag" && (
          <Select
            id="ev-state-to"
            label="Novo estado"
            value={extra.stateTo}
            onChange={(e) =>
              setExtra({ ...extra, stateTo: e.target.value as AdventurerState })
            }
          >
            {ADVENTURER_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}

        {type === "item_gained" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="ev-item-name"
              label="Nome do item"
              value={extra.itemName}
              onChange={(e) => setExtra({ ...extra, itemName: e.target.value })}
            />
            <Field
              id="ev-item-id"
              label="ID do item (opcional)"
              value={extra.itemId}
              onChange={(e) => setExtra({ ...extra, itemId: e.target.value })}
            />
          </div>
        )}

        {type === "item_lost" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="ev-item-lost-id"
              label="ID do item"
              value={extra.itemId}
              onChange={(e) => setExtra({ ...extra, itemId: e.target.value })}
            />
            <Field
              id="ev-item-reason"
              label="Motivo (opcional)"
              value={extra.itemReason}
              onChange={(e) => setExtra({ ...extra, itemReason: e.target.value })}
            />
          </div>
        )}

        {type === "relationship" && (
          <Select
            id="ev-nature"
            label="Natureza"
            value={extra.nature}
            onChange={(e) =>
              setExtra({
                ...extra,
                nature: e.target.value as typeof extra.nature,
              })
            }
          >
            <option value="alliance">Aliança</option>
            <option value="conflict">Conflito</option>
            <option value="bond">Vínculo</option>
            <option value="betrayal">Traição</option>
          </Select>
        )}

        {type === "injury" && (
          <Select
            id="ev-severity"
            label="Gravidade"
            value={extra.severity}
            onChange={(e) =>
              setExtra({ ...extra, severity: e.target.value as typeof extra.severity })
            }
          >
            <option value="minor">Leve</option>
            <option value="grave">Grave</option>
            <option value="critical">Crítica</option>
          </Select>
        )}

        {type === "death" && (
          <Field
            id="ev-cause"
            label="Causa (opcional)"
            value={extra.cause}
            onChange={(e) => setExtra({ ...extra, cause: e.target.value })}
          />
        )}

        {type === "revival" && (
          <Field
            id="ev-method"
            label="Método (opcional)"
            value={extra.method}
            onChange={(e) => setExtra({ ...extra, method: e.target.value })}
          />
        )}

        {type === "title_badge" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="ev-badge-title"
              label="Título (deixe vazio para usar o título do evento)"
              value={extra.badgeTitle}
              onChange={(e) => setExtra({ ...extra, badgeTitle: e.target.value })}
            />
            <Select
              id="ev-granted"
              label="Ação"
              value={extra.granted ? "grant" : "revoke"}
              onChange={(e) =>
                setExtra({ ...extra, granted: e.target.value === "grant" })
              }
            >
              <option value="grant">Conceder</option>
              <option value="revoke">Revogar</option>
            </Select>
          </div>
        )}

        {type === "sheet_revision" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="ev-sheet-url"
              label="URL da ficha"
              value={extra.sheetUrl}
              onChange={(e) => setExtra({ ...extra, sheetUrl: e.target.value })}
            />
            <Field
              id="ev-sheet-note"
              label="Nota (opcional)"
              value={extra.sheetNote}
              onChange={(e) => setExtra({ ...extra, sheetNote: e.target.value })}
            />
          </div>
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
