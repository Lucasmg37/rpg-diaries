"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild } from "@/lib/admin-client";

export default function SessionsListPage() {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminGuild()
      .then(setGuild)
      .catch((e) => setError((e as Error).message));
  }, []);

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
                <li key={s.id}>
                  <Link
                    href={`/admin/management/sessions/${s.id}`}
                    className="panel flex items-center gap-3 p-4 transition-colors hover:border-guild-goldsoft"
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
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
