import Link from "next/link";
import { notFound } from "next/navigation";

import { LooseEndCard } from "@/components/public/LooseEndCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicMasterGuild } from "@/lib/guild-data";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { adventures } = await getPublicMasterGuild();
  return adventures.map(({ adventure }) => ({ slug: adventure.slug }));
}

export default async function AdventureLooseEndsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { adventures } = await getPublicMasterGuild();
  const full = adventures.find((a) => a.adventure.slug === slug);
  if (!full) notFound();

  const { adventure, sessions } = full;

  return (
    <div className="space-y-10">
      <p>
        <Link
          href={`/adventures/${adventure.slug}`}
          className="text-sm text-guild-muted transition-colors hover:text-guild-goldsoft"
        >
          ← {adventure.name}
        </Link>
      </p>

      <section className="panel p-8 text-center">
        <Eyebrow>Mistérios & Pendências</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          Fios Soltos
        </h1>
        <Ornament className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          {adventure.name}
        </p>
      </section>

      <section className="space-y-6">
        {sessions.map((session) =>
          session.looseEnds.length > 0 ? (
            <div key={session.id} className="space-y-4">
              <h3 className="border-b border-guild-border pb-2 font-heading text-base text-guild-gold">
                Sessão {session.number} — {session.title}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {session.looseEnds.map((looseEnd) => (
                  <LooseEndCard key={looseEnd.id} looseEnd={looseEnd} />
                ))}
              </div>
            </div>
          ) : null,
        )}
        {sessions.every((s) => s.looseEnds.length === 0) ? (
          <SectionHeading title="Nenhum fio solto registrado ainda." />
        ) : null}
      </section>
    </div>
  );
}
