"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  ConfirmDialog,
  Field,
  Modal,
  TextArea,
} from "@/components/ui";
import type { Adventure } from "@/core/entities/adventure";
import type { FullGuild } from "@/core/entities/views";
import { deleteAdventure, getAdminGuild, sendJson } from "@/lib/admin-client";
import { useDragReorder } from "@/lib/use-drag-reorder";

const EMPTY = {
  name: "",
  description: "",
};

export function AdventureManager() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Adventure | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    return getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(a: Adventure) {
    setEditingId(a.id);
    setForm({ name: a.name, description: a.description });
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
    try {
      if (editingId) {
        await sendJson(`/api/admin/adventures/${editingId}`, "PATCH", form);
      } else {
        await sendJson("/api/admin/adventures", "POST", form);
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
      await deleteAdventure(deleteTarget.id);
      if (editingId === deleteTarget.id) closeForm();
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const adventureItems =
    guild?.adventures.map(({ adventure }) => ({ id: adventure.id, adventure })) ?? [];
  const { list, dragPropsFor } = useDragReorder(adventureItems, async (orderedIds) => {
    await sendJson("/api/admin/adventures/reorder", "POST", { ids: orderedIds });
    await load();
  });

  if (error && !guild) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-guild-gold">
          Aventuras
        </h1>
        <Button
          type="button"
          onClick={() => {
            reset();
            setFormOpen(true);
          }}
        >
          + Nova aventura
        </Button>
      </div>

      {error && !formOpen ? <Alert tone="error">{error}</Alert> : null}

      <div className="space-y-2">
        {list.map(({ id, adventure: a }) => (
          <div
            key={id}
            {...dragPropsFor(id)}
            className="panel flex cursor-move items-center gap-3 p-4"
          >
            <span aria-hidden className="text-guild-muted">
              ⠿
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {a.name}
              </span>
              <span className="text-xs text-guild-muted">{a.description}</span>
            </span>
            <Button type="button" variant="ghost" onClick={() => startEdit(a)}>
              Editar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(a)}>
              Excluir
            </Button>
          </div>
        ))}
        {guild.adventures.length === 0 ? (
          <p className="text-sm text-guild-muted">Nenhuma aventura cadastrada ainda.</p>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir aventura"
        description={`Esta ação é irreversível e removerá permanentemente a aventura "${deleteTarget?.name}". A exclusão é bloqueada se ela tiver sessões, aventureiros, fios soltos, roteiros ou NPCs/Bosses cadastrados.`}
        confirmText={deleteTarget?.name ?? ""}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Editar aventura" : "Nova aventura"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            id="adv-name"
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextArea
            id="adv-desc"
            label="Descrição"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? "Salvando…" : editingId ? "Salvar" : "Criar"}
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
