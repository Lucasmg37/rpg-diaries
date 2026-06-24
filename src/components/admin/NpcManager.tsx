"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Eyebrow,
  Field,
  Panel,
  Select,
  TextArea,
} from "@/components/ui";
import type { Npc, NpcKind } from "@/core/entities/npc";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, listAdminNpcs, sendJson } from "@/lib/admin-client";
import { npcKindLabel, npcStatusLabel } from "@/lib/npc-view";

const EMPTY = {
  kind: "npc" as NpcKind,
  name: "",
  icon: "🧙",
  role: "",
  description: "",
  masterNotes: "",
  sheetUrl: "",
  pv: 0,
  defesa: 0,
  classOrType: "",
};

export function NpcManager() {
  const router = useRouter();
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [adventureId, setAdventureId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadGuild() {
    return getAdminGuild()
      .then((g) => {
        setGuild(g);
        if (!adventureId && g.adventures[0]) {
          setAdventureId(g.adventures[0].adventure.id);
        }
      })
      .catch((e) => setError((e as Error).message));
  }

  function loadNpcs(id: string) {
    return listAdminNpcs(id)
      .then(setNpcs)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    loadGuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adventureId) loadNpcs(adventureId);
  }, [adventureId]);

  const adventure = useMemo(
    () => guild?.adventures.find((a) => a.adventure.id === adventureId),
    [guild, adventureId],
  );

  function startEdit(n: Npc) {
    setEditingId(n.id);
    setForm({
      kind: n.kind,
      name: n.name,
      icon: n.icon ?? "🧙",
      role: n.role ?? "",
      description: n.description,
      masterNotes: n.masterNotes ?? "",
      sheetUrl: n.sheetUrl ?? "",
      pv: n.stats?.pv ?? 0,
      defesa: n.stats?.defesa ?? 0,
      classOrType: n.stats?.classOrType ?? "",
    });
  }
  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = {
      adventureId,
      kind: form.kind,
      name: form.name,
      icon: form.icon,
      role: form.role || undefined,
      description: form.description,
      masterNotes: form.masterNotes || undefined,
      sheetUrl: form.sheetUrl || undefined,
      stats:
        form.classOrType || form.pv || form.defesa
          ? { classOrType: form.classOrType, pv: form.pv, defesa: form.defesa }
          : undefined,
    };
    try {
      if (editingId) {
        await sendJson(`/api/admin/npcs/${editingId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/npcs", "POST", payload);
      }
      reset();
      await loadNpcs(adventureId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !guild) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-center font-heading text-2xl font-bold text-guild-gold">
        NPCs & Bosses
      </h1>

      {guild.adventures.length > 1 ? (
        <Select
          id="npc-adv"
          label="Aventura"
          value={adventureId}
          onChange={(e) => {
            setAdventureId(e.target.value);
            reset();
          }}
        >
          {guild.adventures.map((a) => (
            <option key={a.adventure.id} value={a.adventure.id}>
              {a.adventure.name}
            </option>
          ))}
        </Select>
      ) : null}

      <div className="space-y-2">
        {npcs.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/admin/management/npcs/${n.id}?adventureId=${adventureId}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                router.push(`/admin/management/npcs/${n.id}?adventureId=${adventureId}`);
            }}
            className="panel flex cursor-pointer items-center gap-3 p-4 transition-colors hover:border-guild-goldsoft"
          >
            <span className="text-xl" aria-hidden>
              {n.icon ?? (n.kind === "boss" ? "👹" : "🧙")}
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {n.name}
              </span>
              <span className="text-xs text-guild-muted">
                {npcKindLabel(n)} · {npcStatusLabel(n)}
                {n.role ? ` · ${n.role}` : ""}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                startEdit(n);
              }}
            >
              Editar
            </Button>
          </div>
        ))}
        {npcs.length === 0 ? (
          <p className="text-sm text-guild-muted">
            Nenhum NPC/Boss cadastrado{adventure ? ` em ${adventure.adventure.name}` : ""} ainda.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Panel className="space-y-4 p-6">
          <Eyebrow>{editingId ? "Editar NPC/Boss" : "Novo NPC/Boss"}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="npc-kind"
              label="Tipo"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as NpcKind })}
            >
              <option value="npc">NPC</option>
              <option value="boss">Boss</option>
            </Select>
            <Field
              id="npc-name"
              label="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              id="npc-icon"
              label="Ícone"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <Field
              id="npc-role"
              label="Papel (ex.: Comerciante de Korad)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Field
              id="npc-sheet"
              label="URL da ficha completa"
              value={form.sheetUrl}
              onChange={(e) => setForm({ ...form, sheetUrl: e.target.value })}
            />
          </div>

          <TextArea
            id="npc-desc"
            label="Descrição (pública — personalidade, história)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextArea
            id="npc-master-notes"
            label="Notas do mestre (sigiloso — nunca aparece para os jogadores)"
            rows={3}
            value={form.masterNotes}
            onChange={(e) => setForm({ ...form, masterNotes: e.target.value })}
          />

          <Eyebrow className="block">Ficha resumida (Tormenta) — para consulta rápida na mesa</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="npc-classortype"
              label="Classe/Tipo"
              value={form.classOrType}
              onChange={(e) => setForm({ ...form, classOrType: e.target.value })}
            />
            <Field
              id="npc-pv"
              label="PV"
              type="number"
              value={form.pv}
              onChange={(e) => setForm({ ...form, pv: Number(e.target.value) })}
            />
            <Field
              id="npc-defesa"
              label="Defesa"
              type="number"
              value={form.defesa}
              onChange={(e) => setForm({ ...form, defesa: Number(e.target.value) })}
            />
          </div>
        </Panel>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting || !form.name.trim()}>
            {submitting ? "Salvando…" : editingId ? "Salvar" : "Adicionar"}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={reset}>
              Cancelar edição
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
