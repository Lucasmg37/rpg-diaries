import { Eyebrow } from "@/components/ui/Eyebrow";
import { Ornament } from "@/components/ui/Ornament";
import { SectionHeading } from "@/components/ui/SectionHeading";

import { RandomMessageButton } from "./RandomMessageButton";

export const dynamic = "force-static";

export const metadata = {
  title: "Sobre — Diário da Guilda",
  description: "Sobre o Diário da Guilda e seu propósito.",
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="panel p-8 text-center">
        <Eyebrow>Sobre</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          O Diário da Guilda
        </h1>
        <Ornament className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          Este é o registro vivo das jornadas, aventureiros e segredos
          guardados pela guilda. Cada sessão, cada NPC e cada fio solto é
          documentado aqui para que nenhuma lenda se perca no tempo.
        </p>
      </section>

      <section className="panel space-y-6 p-8">
        <SectionHeading eyebrow="Propósito" title="Por que este diário existe" />
        <p className="leading-relaxed text-guild-muted">
          Manter a memória das campanhas, dar continuidade às histórias entre
          sessões e oferecer um painel ao mestre para organizar NPCs,
          aventureiros e roteiros.
        </p>
      </section>

      <section className="panel space-y-6 p-8 text-center">
        <SectionHeading
          eyebrow="Curiosidade"
          title="Precisa de uma palavra de sabedoria?"
        />
        <p className="leading-relaxed text-guild-muted">
          A guilda guarda dezenas de ditados, avisos e provocações. Clique
          abaixo para sortear um.
        </p>
        <div className="flex justify-center">
          <RandomMessageButton />
        </div>
      </section>
    </div>
  );
}
