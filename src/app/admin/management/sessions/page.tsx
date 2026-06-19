"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { FullGuild, FullSession } from "@/core/entities/views";
import { deleteSession, getAdminGuild } from "@/lib/admin-client";

export default function SessionsListPage() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FullSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadGuild() {
    return getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    loadGuild();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteSession(deleteTarget.adventureId, deleteTarget.id);
      setDeleteTarget(null);
      await loadGuild();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!guild)
    return <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading title="Sessões" />
        <Link href="/admin/management/sessions/new">
          <Button type="button">+ Nova sessão</Button>
        </Link>
      </div>

      {guild.adventures.map((a) => (
        <div key={a.adventure.id} className="space-y-2">
          <h3 className="font-heading text-sm uppercase tracking-wide text-guild-muted">
            {a.adventure.name}
          </h3>
          {a.sessions.length === 0 ? (
            <p className="text-sm text-guild-muted">Nenhuma sessão ainda.</p>
          ) : (
            <ul className="space-y-2">
              {a.sessions.map((s) => (
                <li
                  key={s.id}
                  className="panel flex items-center gap-3 p-4"
                >
                  <Link
                    href={`/admin/management/sessions/${s.id}`}
                    className="flex flex-1 items-center gap-3 transition-colors hover:text-guild-goldsoft"
                  >
                    <span className="text-xl" aria-hidden>
                      {s.icon}
                    </span>
                    <span className="flex-1 font-heading text-sm font-semibold text-guild-gold">
                      Sessão {s.number} — {s.title}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-guild-goldsoft">
                      editar →
                    </span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!text-red-400 hover:!text-red-300"
                    onClick={() => setDeleteTarget(s)}
                  >
                    Excluir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir sessão"
        description={`Esta ação é irreversível e removerá permanentemente a sessão "${deleteTarget?.title}".`}
        confirmText={deleteTarget ? `Sessão ${deleteTarget.number}` : ""}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
