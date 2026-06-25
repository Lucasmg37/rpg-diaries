"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  CheckboxOption,
  ConfirmDialog,
  Field,
  Modal,
  Select,
  TextArea,
} from "@/components/ui";
import type { LooseEnd } from "@/core/entities/loose-end";
import type { FullGuild } from "@/core/entities/views";
import { deleteLooseEnd, getAdminGuild, sendJson } from "@/lib/admin-client";

const EMPTY = {
  title: "",
  category: "",
  description: "",
  color: "#a07a40",
  icon: "🧵",
  resolved: false,
};

export function LooseEndManager() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [adventureId, setAdventureId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LooseEnd | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function startEdit(l: LooseEnd) {
    setEditingId(l.id);
    setForm({
      title: l.title,
      category: l.category,
      description: l.description,
      color: l.color,
      icon: l.icon,
      resolved: l.resolved,
    });
    setFormOpen(true);
  }
  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }
  function closeForm() {
    reset();
    setFormOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = { ...form, adventureId };
    try {
      if (editingId) {
        await sendJson(`/api/admin/loose-ends/${editingId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/loose-ends", "POST", payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteLooseEnd(adventureId, deleteTarget.id);
      if (editingId === deleteTarget.id) closeForm();
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (error && !guild) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-guild-gold">
          Fios Soltos
        </h1>
        <Button
          type="button"
          onClick={() => {
            reset();
            setFormOpen(true);
          }}
        >
          + Novo fio solto
        </Button>
      </div>

      {error && !formOpen ? <Alert tone="error">{error}</Alert> : null}

      {guild.adventures.length > 1 ? (
        <Select
          id="le-adv"
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
        {adventure?.looseEnds.map((l) => (
          <div key={l.id} className="panel flex items-center gap-3 p-4">
            <span className="text-xl" aria-hidden>
              {l.icon}
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {l.title}
              </span>
              <span className="text-xs text-guild-muted">
                {l.category} · {l.resolved ? "resolvido" : "em aberto"}
              </span>
            </span>
            <Button type="button" variant="ghost" onClick={() => startEdit(l)}>
              Editar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(l)}>
              Excluir
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir fio solto"
        description={`Esta ação é irreversível e removerá permanentemente o fio solto "${deleteTarget?.title}". A exclusão é bloqueada se ele estiver vinculado a alguma sessão.`}
        confirmText={deleteTarget?.title ?? ""}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Editar fio solto" : "Novo fio solto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="le-title"
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Field
              id="le-cat"
              label="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Field
              id="le-icon"
              label="Ícone"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <Field
              id="le-color"
              label="Cor (hex)"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <TextArea
            id="le-desc"
            label="Descrição"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <CheckboxOption
            checked={form.resolved}
            onChange={() => setForm({ ...form, resolved: !form.resolved })}
          >
            Resolvido
          </CheckboxOption>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Salvando…" : editingId ? "Salvar" : "Adicionar"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
