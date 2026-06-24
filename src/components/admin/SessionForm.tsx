"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  CheckboxOption,
  ConfirmDialog,
  Eyebrow,
  Field,
  Panel,
  Select,
  TextArea,
} from "@/components/ui";
import type { LooseEnd } from "@/core/entities/loose-end";
import type { Npc } from "@/core/entities/npc";
import type { ParticipantState } from "@/core/entities/session-participant";
import type { FullGuild, FullSession } from "@/core/entities/views";
import {
  deleteSession,
  getAdminGuild,
  listAdminNpcs,
  sendJson,
} from "@/lib/admin-client";
import { npcKindLabel } from "@/lib/npc-view";

const EMPTY_LOOSE_END = {
  title: "",
  category: "",
  description: "",
  color: "#a07a40",
  icon: "🧵",
};

type ParticipantDraft = {
  adventurerId: string;
  name: string;
  icon: string;
  include: boolean;
  sessionBadge: string;
  sessionState: ParticipantState;
  sessionNote: string;
};
type TimelineDraft = { icon: string; title: string; body: string; callout: string };
type TagDraft = { label: string; color: string; icon: string };

const STATES: ParticipantState[] = ["normal", "suspicious", "fallen", "new"];

export function SessionForm({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(sessionId);

  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Campos escalares
  const [adventureId, setAdventureId] = useState("");
  const [title, setTitle] = useState("");
  const [number, setNumber] = useState(1);
  const [icon, setIcon] = useState("📜");
  const [summary, setSummary] = useState("");
  const [masterNotes, setMasterNotes] = useState("");
  const [closingQuote, setClosingQuote] = useState("");
  const [closingTagline, setClosingTagline] = useState("");

  const [tags, setTags] = useState<TagDraft[]>([]);
  const [timeline, setTimeline] = useState<TimelineDraft[]>([]);
  const [participants, setParticipants] = useState<ParticipantDraft[]>([]);
  const [looseEndIds, setLooseEndIds] = useState<string[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [npcIds, setNpcIds] = useState<string[]>([]);

  // Fios soltos criados inline nesta sessão (ainda não vieram da guild carregada).
  const [newLooseEnds, setNewLooseEnds] = useState<LooseEnd[]>([]);
  const [showNewLE, setShowNewLE] = useState(false);
  const [newLE, setNewLE] = useState({ ...EMPTY_LOOSE_END });
  const [creatingLE, setCreatingLE] = useState(false);
  const [leError, setLeError] = useState("");

  const editingSession: FullSession | undefined = useMemo(() => {
    if (!guild || !sessionId) return undefined;
    for (const a of guild.adventures) {
      const s = a.sessions.find((x) => x.id === sessionId);
      if (s) return s;
    }
    return undefined;
  }, [guild, sessionId]);

  const currentAdventure = useMemo(
    () => guild?.adventures.find((a) => a.adventure.id === adventureId),
    [guild, adventureId],
  );

  // Carrega a guild e inicializa os campos escalares.
  useEffect(() => {
    getAdminGuild()
      .then((g) => {
        setGuild(g);
        if (isEdit) {
          let found: FullSession | undefined;
          for (const a of g.adventures) {
            const s = a.sessions.find((x) => x.id === sessionId);
            if (s) found = s;
          }
          if (found) {
            setAdventureId(found.adventureId);
            setTitle(found.title);
            setNumber(found.number);
            setIcon(found.icon);
            setSummary(found.summary);
            setMasterNotes(found.masterNotes ?? "");
            setClosingQuote(found.closing?.quote ?? "");
            setClosingTagline(found.closing?.tagline ?? "");
            setTags(found.tags.map((t) => ({ label: t.label, color: t.color, icon: t.icon ?? "" })));
            setTimeline(
              found.timeline.map((t) => ({
                icon: t.icon,
                title: t.title,
                body: t.body,
                callout: t.callout ?? "",
              })),
            );
            setLooseEndIds(found.looseEnds.map((l) => l.id));
            setNpcIds(found.npcIds ?? []);
          }
        } else {
          const first = g.adventures[0];
          if (first) {
            setAdventureId(first.adventure.id);
            const maxN = first.sessions.reduce((m, s) => Math.max(m, s.number), 0);
            setNumber(maxN + 1);
          }
        }
      })
      .catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega os NPCs/Bosses da aventura selecionada, para marcar presença na sessão.
  useEffect(() => {
    if (!adventureId) return;
    listAdminNpcs(adventureId)
      .then(setNpcs)
      .catch((e) => setError((e as Error).message));
  }, [adventureId]);

  // (Re)constrói os rascunhos de participantes a partir do elenco da aventura.
  useEffect(() => {
    if (!currentAdventure) return;
    setParticipants(
      currentAdventure.adventurers.map((adv) => {
        const existing = editingSession?.participants.find(
          (p) => p.adventurer.id === adv.id,
        );
        return {
          adventurerId: adv.id,
          name: adv.name,
          icon: adv.icon,
          include: Boolean(existing),
          sessionBadge: existing?.sessionBadge ?? "",
          sessionState: existing?.sessionState ?? "normal",
          sessionNote: existing?.sessionNote ?? "",
        };
      }),
    );
    // Ao trocar de aventura, descarta fios soltos criados inline e seleções inválidas.
    setNewLooseEnds([]);
    setLooseEndIds((prev) =>
      prev.filter((id) =>
        currentAdventure.looseEnds.some((l) => l.id === id),
      ),
    );
  }, [currentAdventure, editingSession]);

  // Descarta NPCs selecionados que não pertencem mais à aventura atual.
  useEffect(() => {
    setNpcIds((prev) => prev.filter((id) => npcs.some((n) => n.id === id)));
  }, [npcs]);

  // Fios soltos disponíveis = os da aventura + os criados inline nesta sessão.
  const looseEndOptions: LooseEnd[] = [
    ...(currentAdventure?.looseEnds ?? []),
    ...newLooseEnds,
  ];

  async function handleCreateLooseEnd() {
    if (!newLE.title.trim()) return;
    setCreatingLE(true);
    setLeError("");
    try {
      const created = await sendJson<LooseEnd>("/api/admin/loose-ends", "POST", {
        ...newLE,
        adventureId,
        resolved: false,
      });
      setNewLooseEnds((prev) => [...prev, created]);
      setLooseEndIds((prev) => [...prev, created.id]); // já associa à sessão
      setNewLE({ ...EMPTY_LOOSE_END });
      setShowNewLE(false);
    } catch (e) {
      setLeError((e as Error).message);
    } finally {
      setCreatingLE(false);
    }
  }

  function patchTimeline(i: number, key: keyof TimelineDraft, value: string) {
    setTimeline((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  }
  function patchTag(i: number, key: keyof TagDraft, value: string) {
    setTags((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  }
  function patchParticipant(
    i: number,
    key: keyof ParticipantDraft,
    value: string | boolean,
  ) {
    setParticipants((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      adventureId,
      title,
      number,
      icon,
      summary,
      masterNotes,
      tags: tags.filter((t) => t.label.trim()),
      timeline: timeline
        .filter((t) => t.title.trim() || t.body.trim())
        .map((t) => ({
          icon: t.icon,
          title: t.title,
          body: t.body,
          ...(t.callout.trim() ? { callout: t.callout } : {}),
        })),
      participants: participants
        .filter((p) => p.include)
        .map((p) => ({
          adventurerId: p.adventurerId,
          sessionBadge: p.sessionBadge,
          ...(p.sessionState !== "normal" ? { sessionState: p.sessionState } : {}),
          ...(p.sessionNote.trim() ? { sessionNote: p.sessionNote } : {}),
        })),
      looseEndIds,
      npcIds,
      closing: closingQuote.trim()
        ? { quote: closingQuote, tagline: closingTagline }
        : undefined,
    };

    try {
      if (isEdit) {
        await sendJson(`/api/admin/sessions/${sessionId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/sessions", "POST", payload);
      }
      router.push("/admin/management/sessions");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!sessionId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteSession(adventureId, sessionId);
      router.push("/admin/management/sessions");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  if (error && !guild) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-center font-heading text-2xl font-bold text-guild-gold">
        {isEdit ? "Editar sessão" : "Nova sessão"}
      </h1>

      {/* Dados gerais */}
      <Panel className="space-y-4 p-6">
        <Eyebrow>Dados gerais</Eyebrow>
        {guild.adventures.length > 1 ? (
          <Select
            id="adventure"
            label="Aventura"
            value={adventureId}
            disabled={isEdit}
            onChange={(e) => setAdventureId(e.target.value)}
          >
            {guild.adventures.map((a) => (
              <option key={a.adventure.id} value={a.adventure.id}>
                {a.adventure.name}
              </option>
            ))}
          </Select>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="number"
            label="Número"
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
          />
          <Field
            id="icon"
            label="Ícone"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
          <div className="sm:col-span-1" />
        </div>
        <Field
          id="title"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextArea
          id="summary"
          label="Resumo"
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Panel>

      {/* Participantes */}
      <Panel className="space-y-3 p-6">
        <Eyebrow>Participantes</Eyebrow>
        {participants.length === 0 ? (
          <p className="text-sm text-guild-muted">
            Nenhum aventureiro cadastrado nesta aventura ainda.
          </p>
        ) : (
          participants.map((p, i) => (
            <div
              key={p.adventurerId}
              className="rounded-md border border-guild-border p-3"
            >
              <CheckboxOption
                checked={p.include}
                onChange={() => patchParticipant(i, "include", !p.include)}
              >
                <span aria-hidden>{p.icon}</span> {p.name}
              </CheckboxOption>
              {p.include ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field
                    id={`badge-${p.adventurerId}`}
                    label="Badge"
                    value={p.sessionBadge}
                    onChange={(e) =>
                      patchParticipant(i, "sessionBadge", e.target.value)
                    }
                  />
                  <Select
                    id={`state-${p.adventurerId}`}
                    label="Estado"
                    value={p.sessionState}
                    onChange={(e) =>
                      patchParticipant(i, "sessionState", e.target.value)
                    }
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <Field
                    id={`note-${p.adventurerId}`}
                    label="Nota (opcional)"
                    value={p.sessionNote}
                    onChange={(e) =>
                      patchParticipant(i, "sessionNote", e.target.value)
                    }
                  />
                </div>
              ) : null}
            </div>
          ))
        )}
      </Panel>

      {/* Linha do tempo */}
      <Panel className="space-y-3 p-6">
        <Eyebrow>Linha do tempo</Eyebrow>
        {timeline.map((t, i) => (
          <div key={i} className="space-y-2 rounded-md border border-guild-border p-3">
            <div className="grid gap-2 sm:grid-cols-[5rem_1fr]">
              <Field
                id={`tl-icon-${i}`}
                label="Ícone"
                value={t.icon}
                onChange={(e) => patchTimeline(i, "icon", e.target.value)}
              />
              <Field
                id={`tl-title-${i}`}
                label="Título"
                value={t.title}
                onChange={(e) => patchTimeline(i, "title", e.target.value)}
              />
            </div>
            <TextArea
              id={`tl-body-${i}`}
              label="Texto"
              rows={2}
              value={t.body}
              onChange={(e) => patchTimeline(i, "body", e.target.value)}
            />
            <Field
              id={`tl-callout-${i}`}
              label="Destaque (opcional)"
              value={t.callout}
              onChange={(e) => patchTimeline(i, "callout", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTimeline((p) => p.filter((_, idx) => idx !== i))}
            >
              Remover entrada
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setTimeline((p) => [...p, { icon: "•", title: "", body: "", callout: "" }])
          }
        >
          + Adicionar entrada
        </Button>
      </Panel>

      {/* Tags */}
      <Panel className="space-y-3 p-6">
        <Eyebrow>Etiquetas</Eyebrow>
        {tags.map((t, i) => (
          <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_8rem_5rem_auto]">
            <Field
              id={`tag-label-${i}`}
              label="Rótulo"
              value={t.label}
              onChange={(e) => patchTag(i, "label", e.target.value)}
            />
            <Field
              id={`tag-color-${i}`}
              label="Cor (hex)"
              value={t.color}
              onChange={(e) => patchTag(i, "color", e.target.value)}
            />
            <Field
              id={`tag-icon-${i}`}
              label="Ícone"
              value={t.icon}
              onChange={(e) => patchTag(i, "icon", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTags((p) => p.filter((_, idx) => idx !== i))}
            >
              Remover
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setTags((p) => [...p, { label: "", color: "#a07a40", icon: "" }])
          }
        >
          + Adicionar etiqueta
        </Button>
      </Panel>

      {/* Fios soltos */}
      <Panel className="space-y-3 p-6">
        <Eyebrow>Fios soltos desta sessão</Eyebrow>
        {looseEndOptions.length > 0 ? (
          looseEndOptions.map((l) => (
            <CheckboxOption
              key={l.id}
              checked={looseEndIds.includes(l.id)}
              onChange={() =>
                setLooseEndIds((prev) =>
                  prev.includes(l.id)
                    ? prev.filter((x) => x !== l.id)
                    : [...prev, l.id],
                )
              }
            >
              <span aria-hidden>{l.icon}</span> {l.title}
            </CheckboxOption>
          ))
        ) : (
          <p className="text-sm text-guild-muted">
            Nenhum fio solto cadastrado nesta aventura.
          </p>
        )}

        {/* Criação inline de fio solto */}
        {showNewLE ? (
          <div className="space-y-3 rounded-md border border-guild-border p-3">
            <Eyebrow>Novo fio solto</Eyebrow>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="nle-title"
                label="Título"
                value={newLE.title}
                onChange={(e) => setNewLE({ ...newLE, title: e.target.value })}
              />
              <Field
                id="nle-cat"
                label="Categoria"
                value={newLE.category}
                onChange={(e) => setNewLE({ ...newLE, category: e.target.value })}
              />
              <Field
                id="nle-icon"
                label="Ícone"
                value={newLE.icon}
                onChange={(e) => setNewLE({ ...newLE, icon: e.target.value })}
              />
              <Field
                id="nle-color"
                label="Cor (hex)"
                value={newLE.color}
                onChange={(e) => setNewLE({ ...newLE, color: e.target.value })}
              />
            </div>
            <TextArea
              id="nle-desc"
              label="Descrição"
              rows={2}
              value={newLE.description}
              onChange={(e) =>
                setNewLE({ ...newLE, description: e.target.value })
              }
            />
            {leError ? <Alert tone="error">{leError}</Alert> : null}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleCreateLooseEnd}
                disabled={creatingLE || !newLE.title.trim()}
              >
                {creatingLE ? "Criando…" : "Criar e associar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowNewLE(false);
                  setNewLE({ ...EMPTY_LOOSE_END });
                  setLeError("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowNewLE(true)}
          >
            + Novo fio solto
          </Button>
        )}
      </Panel>

      {/* NPCs & Bosses presentes */}
      <Panel className="space-y-3 p-6">
        <Eyebrow>NPCs & Bosses presentes nesta sessão</Eyebrow>
        {npcs.length > 0 ? (
          npcs.map((n) => (
            <CheckboxOption
              key={n.id}
              checked={npcIds.includes(n.id)}
              onChange={() =>
                setNpcIds((prev) =>
                  prev.includes(n.id)
                    ? prev.filter((x) => x !== n.id)
                    : [...prev, n.id],
                )
              }
            >
              <span aria-hidden>{n.icon ?? (n.kind === "boss" ? "👹" : "🧙")}</span>{" "}
              {n.name}
              <span className="text-xs text-guild-muted/70">
                ({npcKindLabel(n)})
              </span>
            </CheckboxOption>
          ))
        ) : (
          <p className="text-sm text-guild-muted">
            Nenhum NPC/Boss cadastrado nesta aventura ainda.
          </p>
        )}
        <p className="text-xs text-guild-muted">
          Marcar aqui só associa o NPC a esta sessão. Para registrar que os
          aventureiros o viram (e liberar a ficha pública dele), use o evento
          de aparição na página do NPC.
        </p>
      </Panel>

      {/* Notas do mestre + encerramento */}
      <Panel className="space-y-4 p-6">
        <Eyebrow>Notas do mestre (privadas)</Eyebrow>
        <TextArea
          id="masterNotes"
          label="Notas (não aparecem no diário público)"
          rows={3}
          value={masterNotes}
          onChange={(e) => setMasterNotes(e.target.value)}
        />
        <Eyebrow>Nota de encerramento (opcional)</Eyebrow>
        <Field
          id="closingQuote"
          label="Citação"
          value={closingQuote}
          onChange={(e) => setClosingQuote(e.target.value)}
        />
        <Field
          id="closingTagline"
          label="Linha final"
          value={closingTagline}
          onChange={(e) => setClosingTagline(e.target.value)}
        />
      </Panel>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar sessão"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/management/sessions")}
        >
          Cancelar
        </Button>
        {isEdit ? (
          <Button
            type="button"
            variant="danger"
            className="ml-auto"
            onClick={() => setConfirmingDelete(true)}
          >
            Excluir sessão
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Excluir sessão"
        description={`Esta ação é irreversível e removerá permanentemente a sessão "${title}".`}
        confirmText={`Sessão ${number}`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </form>
  );
}
