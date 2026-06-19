import Link from "next/link";

import { isUsingSampleData } from "@/adapters/config/repository-factory";
import { TagBadge } from "@/components/public/TagBadge";
import { Alert } from "@/components/ui/Alert";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicMasterGuild } from "@/lib/guild-data";

export const dynamic = "force-static";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const roman = (n: number) => ROMAN[n] ?? String(n);

export default async function HomePage() {
  const { guild, adventures } = await getPublicMasterGuild();

  return (
    <div className="space-y-10">
      {isUsingSampleData() ? (
        <Alert tone="info" className="text-center text-xs">
          ⚙ Exibindo dados de exemplo (in-memory). Configure as credenciais do
          Firebase para usar o Firestore.
        </Alert>
      ) : null}

      {/* Apresentação da guild */}
      <section className="panel p-8 text-center">
        <Eyebrow>Navegação</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          {guild.name}
        </h1>
        <Ornament className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          {guild.description}
        </p>
      </section>

      {adventures.map((full) => (
        <section key={full.adventure.id} className="space-y-6">
          <SectionHeading
            eyebrow="Sumário do Diário"
            title={full.adventure.name}
          />

          {/* Índice de sessões — cards no estilo do HTML de referência */}
          <div className="grid gap-6 sm:grid-cols-2">
            {full.sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="panel group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:border-guild-goldsoft"
              >
                <Eyebrow>Sessão {roman(session.number)}</Eyebrow>
                <h3 className="mt-1 flex items-center gap-2 font-heading text-lg font-semibold text-guild-gold">
                  <span aria-hidden>{session.icon}</span>
                  {session.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-guild-muted">
                  {session.summary}
                </p>
                {session.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {session.tags.map((tag) => (
                      <TagBadge key={tag.label} tag={tag} />
                    ))}
                  </div>
                ) : null}
                <span className="mt-4 font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft transition-colors group-hover:text-guild-gold">
                  Ler relatório →
                </span>
              </Link>
            ))}
          </div>

          {/* Acesso a aventureiros + fios soltos */}
          <Link
            href={`/adventures/${full.adventure.slug}`}
            className="panel flex items-center justify-between gap-3 p-5 transition-colors hover:border-guild-goldsoft"
          >
            <span>
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                👥 Aventureiros &amp; 🧵 Fios Soltos
              </span>
              <span className="mt-1 block text-xs text-guild-muted">
                {full.adventurers.length} aventureiros ·{" "}
                {full.looseEnds.length} fios soltos
              </span>
            </span>
            <span className="shrink-0 font-heading text-[11px] uppercase tracking-wide text-guild-goldsoft">
              Abrir →
            </span>
          </Link>
        </section>
      ))}
    </div>
  );
}
