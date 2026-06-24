import type { Metadata } from "next";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { Ornament } from "@/components/ui/Ornament";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { Quote } from "@/components/ui/Quote";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Select } from "@/components/ui/Select";
import { Stat } from "@/components/ui/Stat";
import { TextArea } from "@/components/ui/TextArea";
import { accent, colors, fonts } from "@/components/ui/tokens";
import { ConfirmDialogDemo } from "./ConfirmDialogDemo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Design System · Diário da Guilda",
};

const COLOR_NOTES: Record<string, string> = {
  bg1: "Fundo (topo do gradiente)",
  bg2: "Fundo / superfície de painel",
  gold: "Dourado principal — títulos, destaque",
  goldsoft: "Dourado vivo — links, CTA",
  muted: "Texto de corpo / apagado",
  border: "Bordas e divisórias",
  red: "Acento — perigo / perda",
  purple: "Acento — magia / mistério",
  green: "Acento — novo / cura",
  danger: "Borda de estado 'suspeito'",
};

// Estados visuais do PartyCard (contextuais por sessão).
const PARTY_STATES: Array<{ label: string; cls: string; badge: string }> = [
  { label: "normal", cls: "border-guild-border bg-guild-bg2/60", badge: "↑ Nv. 2" },
  { label: "suspicious", cls: "border-guild-danger bg-guild-danger/15", badge: "⚠ Suspeito" },
  { label: "fallen", cls: "border-guild-border bg-guild-bg2/60 opacity-60", badge: "✝ Caído" },
  { label: "new", cls: "border-guild-green bg-guild-green/10", badge: "Novo membro" },
];

// Estados de status de NPC/Boss (NpcStatus, projetado pela timeline de NpcEvent).
const NPC_STATES: Array<{
  label: string;
  pillColor: string;
  opacity?: boolean;
}> = [
  { label: "alive", pillColor: colors.green },
  { label: "dead", pillColor: colors.red, opacity: true },
  { label: "revived", pillColor: colors.green },
  { label: "missing", pillColor: colors.red },
  { label: "unknown", pillColor: colors.red },
];

export default function DesignSystemPage() {
  return (
    <div className="space-y-12">
      <section className="panel p-8 text-center">
        <Eyebrow>Referência</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold text-guild-gold">
          Mini Design System
        </h1>
        <Ornament className="my-4" />
        <p className="mx-auto max-w-2xl leading-relaxed text-guild-muted">
          Tokens e componentes extraídos do diário de referência. Tema escuro de
          guilda — pergaminho queimado, dourado e tipografia clássica.
        </p>
      </section>

      {/* CORES */}
      <section className="space-y-5">
        <SectionHeading eyebrow="Tokens" title="Paleta" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {(Object.keys(colors) as Array<keyof typeof colors>).map((name) => (
            <Panel key={name} className="overflow-hidden">
              <div
                className="h-16 w-full border-b border-guild-border"
                style={{ backgroundColor: colors[name] }}
              />
              <div className="p-3">
                <p className="font-heading text-sm text-guild-gold">{name}</p>
                <p className="text-xs uppercase tracking-wide text-guild-muted">
                  {colors[name]}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-guild-muted">
                  {COLOR_NOTES[name]}
                </p>
              </div>
            </Panel>
          ))}
        </div>
        <p className="text-center text-xs text-guild-muted">
          Acentos de dados (tags / fios soltos): purple, amber, red, gray.
        </p>
      </section>

      {/* TIPOGRAFIA */}
      <section className="space-y-5">
        <SectionHeading eyebrow="Tokens" title="Tipografia" />
        <Panel className="space-y-4 p-6">
          <div>
            <Eyebrow>Heading · {fonts.heading.split(",")[0]}</Eyebrow>
            <p className="font-heading text-3xl font-bold text-guild-gold">
              Diário da Guilda
            </p>
            <p className="font-heading text-xl text-guild-gold">
              Título de seção
            </p>
          </div>
          <hr className="border-guild-border" />
          <div>
            <Eyebrow>Body · {fonts.body.split(",")[0]}</Eyebrow>
            <p className="leading-relaxed text-guild-muted">
              O grupo enfrentou o boss do seu primeiro desafio coletivo. A
              batalha foi dura — três membros caíram durante o confronto.{" "}
              <em className="text-guild-goldsoft">Texto enfatizado em itálico.</em>
            </p>
          </div>
          <hr className="border-guild-border" />
          <div>
            <Eyebrow>Eyebrow · 10px / maiúsculas / tracking</Eyebrow>
          </div>
        </Panel>
      </section>

      {/* PRIMITIVAS */}
      <section className="space-y-5">
        <SectionHeading eyebrow="Componentes" title="Primitivas" />

        <Panel className="space-y-3 p-6">
          <Eyebrow>Pill</Eyebrow>
          <div className="flex flex-wrap gap-2">
            <Pill color={accent.purple} icon="🔮">
              Magia
            </Pill>
            <Pill color={accent.amber} icon="📚">
              Investigação
            </Pill>
            <Pill color={accent.red} icon="🏛">
              Política
            </Pill>
            <Pill color={accent.gray} icon="💰">
              Pessoal
            </Pill>
          </div>
        </Panel>

        <Panel className="space-y-3 p-6">
          <Eyebrow>Stat</Eyebrow>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={5} label="Membros totais" />
            <Stat value={4} label="Ativos agora" />
            <Stat value={1} label="Caídos" accent />
            <Stat value={2} label="Sessões" />
          </div>
        </Panel>

        <Panel className="space-y-3 p-6">
          <Eyebrow>Callout</Eyebrow>
          <Callout>
            Do céu, veio apenas uma resposta: &ldquo;Você é fraco&rdquo;.
          </Callout>
          <Callout tone="amber">
            Tone amber — testes e confrontos.
          </Callout>
          <Callout tone="purple">
            Tone purple — segredos do mestre.
          </Callout>
          <Callout tone="red">
            Tone red — riscos e perigos.
          </Callout>
          <Callout tone="green">
            Tone green — recompensas e conclusões.
          </Callout>
        </Panel>

        <Panel className="space-y-3 p-6">
          <Eyebrow>Ornament</Eyebrow>
          <Ornament />
        </Panel>

        <Panel className="space-y-4 p-6">
          <Eyebrow>Quote (nota de encerramento)</Eyebrow>
          <Quote
            quote="Nem toda vitória chega sem perdas — e Zephyron pagou o preço por todos."
            tagline="Que seu roubo silencioso não tenha sido em vão."
          />
        </Panel>
      </section>

      {/* FORMULÁRIOS */}
      <section className="space-y-5">
        <SectionHeading eyebrow="Componentes" title="Formulários" />

        <Panel className="space-y-4 p-6">
          <Eyebrow>Field</Eyebrow>
          <Field
            id="ds-demo"
            label="Senha"
            type="password"
            placeholder="••••••••"
          />

          <Eyebrow>TextArea</Eyebrow>
          <TextArea
            id="ds-textarea"
            label="Resumo"
            rows={2}
            placeholder="Resumo da sessão…"
          />

          <Eyebrow>Select</Eyebrow>
          <Select id="ds-select" label="Estado" defaultValue="normal">
            <option value="normal">normal</option>
            <option value="suspicious">suspicious</option>
            <option value="fallen">fallen</option>
            <option value="new">new</option>
          </Select>

          <Eyebrow>Button</Eyebrow>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button">Ação primária</Button>
            <Button type="button" disabled>
              Desabilitado
            </Button>
            <Button type="button" variant="ghost">
              Ação sutil
            </Button>
            <Button type="button" variant="danger">
              Excluir
            </Button>
          </div>

          <Eyebrow>Alert</Eyebrow>
          <Alert tone="error">Senha incorreta.</Alert>
          <Alert tone="info">Exibindo dados de exemplo (in-memory).</Alert>
        </Panel>

        <Panel className="space-y-3 p-6">
          <Eyebrow>ConfirmDialog</Eyebrow>
          <p className="text-xs text-guild-muted">
            Modal de confirmação para ações destrutivas (exclusão de roteiros,
            sessões etc.) — exige digitar o nome exato da entidade antes de
            habilitar o botão de exclusão.
          </p>
          <ConfirmDialogDemo />
        </Panel>
      </section>

      {/* ESTADOS DO PARTY CARD */}
      <section className="space-y-5">
        <SectionHeading
          eyebrow="Componentes"
          title="Estados do Party Card"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PARTY_STATES.map((state) => (
            <div
              key={state.label}
              className={`flex flex-col items-center rounded-md border p-4 text-center ${state.cls}`}
            >
              <span className="text-2xl" aria-hidden>
                ⚔️
              </span>
              <span className="mt-2 font-heading text-sm font-semibold text-guild-gold">
                Aventureiro
              </span>
              <span className="mt-1 text-[11px] text-guild-muted">
                Classe · Nv. 2
              </span>
              <span className="mt-2 inline-block rounded-full bg-guild-border/30 px-2 py-0.5 font-heading text-[9px] tracking-wide text-guild-goldsoft">
                {state.badge}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-wide text-guild-muted">
                .{state.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ESTADOS DE NPC/BOSS */}
      <section className="space-y-5">
        <SectionHeading eyebrow="Componentes" title="Estados de NPC/Boss" />
        <p className="text-center text-xs text-guild-muted">
          Status projetado pela timeline de <code>NpcEvent</code> — exibido em{" "}
          <code>NpcCard</code>, <code>NpcDetail</code> e nas pílulas do{" "}
          <code>StoryPlanDocument</code>.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NPC_STATES.map((state) => (
            <div
              key={state.label}
              className={`flex flex-col items-center rounded-md border border-guild-border bg-guild-bg2/60 p-4 text-center ${
                state.opacity ? "opacity-60" : ""
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {state.label === "alive" || state.label === "revived" ? "👹" : "🧙"}
              </span>
              <span className="mt-2 font-heading text-sm font-semibold text-guild-gold">
                NPC/Boss
              </span>
              <Pill color={state.pillColor} className="mt-2">
                {state.label}
              </Pill>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
