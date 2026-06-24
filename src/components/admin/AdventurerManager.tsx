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
import type { Adventurer } from "@/core/entities/adventurer";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, sendJson } from "@/lib/admin-client";
import { adventurerClassLabel, adventurerLevel, adventurerStatusLabel } from "@/lib/adventurer-view";

const EMPTY = {
  name: "",
  className: "",
  icon: "🧝",
  level: 1,
  background: "",
  goal: "",
  sheetUrl: "",
};

export function AdventurerManager() {
  const router = useRouter();
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [adventureId, setAdventureId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    return getAdminGuild()
      .then((g) => {
        setGuild(g);
        if (!adventureId && g.adventures[0]) {
          setAdventureId(g.adventures[0].adventure.id);
        }
      })
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adventure = useMemo(
    () => guild?.adventures.find((a) => a.adventure.id === adventureId),
    [guild, adventureId],
  );

  function startEdit(a: Adventurer) {
    setEditingId(a.id);
    setForm({
      name: a.name,
      className: a.className,
      icon: a.icon,
      level: 1,
      background: a.background,
      goal: a.goal ?? "",
      sheetUrl: a.sheetUrl,
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
    const payload = { ...form, adventureId };
    try {
      if (editingId) {
        await sendJson(`/api/admin/adventurers/${editingId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/adventurers", "POST", payload);
      }
      reset();
      await load();
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
        Aventureiros
      </h1>

      {guild.adventures.length > 1 ? (
        <Select
          id="adv"
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
        {adventure?.adventurers.map((a) => (
          <div
            key={a.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/admin/management/adventurers/${a.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                router.push(`/admin/management/adventurers/${a.id}`);
            }}
            className="panel flex cursor-pointer items-center gap-3 p-4 transition-colors hover:border-guild-goldsoft"
          >
            <span className="text-xl" aria-hidden>
              {a.icon}
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {a.name}
              </span>
              <span className="text-xs text-guild-muted">
                {adventurerClassLabel(a)} · Nv. {adventurerLevel(a)} · {adventurerStatusLabel(a)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                startEdit(a);
              }}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Panel className="space-y-4 p-6">
          <Eyebrow>{editingId ? "Editar aventureiro" : "Novo aventureiro"}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="ad-name"
              label="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              id="ad-class"
              label="Classe"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
            />
            <Field
              id="ad-icon"
              label="Ícone"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            {!editingId ? (
              <Field
                id="ad-level"
                label="Nível inicial"
                type="number"
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: Number(e.target.value) })
                }
              />
            ) : null}
            <Field
              id="ad-sheet"
              label="URL da ficha"
              value={form.sheetUrl}
              onChange={(e) => setForm({ ...form, sheetUrl: e.target.value })}
            />
          </div>
          <TextArea
            id="ad-bg"
            label="História"
            rows={2}
            value={form.background}
            onChange={(e) => setForm({ ...form, background: e.target.value })}
          />
          <TextArea
            id="ad-goal"
            label="Objetivo"
            rows={2}
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
          />
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
