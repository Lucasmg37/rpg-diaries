import { Eyebrow, Pill, StatCard } from "@/components/ui";
import { colors } from "@/components/ui/tokens";
import type { Npc } from "@/core/entities/npc";
import {
  formatNpcDamage,
  formatNpcSavingThrow,
  formatNpcSkill,
  isNpcDead,
  npcKindLabel,
  npcStatusLabel,
} from "@/lib/npc-view";

/**
 * Ficha completa de um NPC/Boss (identidade + combate) — usada tanto na página
 * pública `/npcs/[id]` quanto no modal de detalhe aberto a partir dos badges.
 */
export function NpcSheetContent({
  npc,
  panelled = true,
}: {
  npc: Npc;
  /** Envolve cada seção em `.panel` — desligue quando já dentro de um Modal/Panel. */
  panelled?: boolean;
}) {
  const isDead = isNpcDead(npc);
  const stats = npc.stats;

  return (
    <div className="space-y-6">
      <section className={panelled ? "panel space-y-3 p-8 text-center" : "space-y-3 text-center"}>
        <Eyebrow>{npcKindLabel(npc)} da Crônica</Eyebrow>
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl" aria-hidden>
            {npc.icon ?? (npc.kind === "boss" ? "👹" : "🧙")}
          </span>
          <h2 className="font-heading text-xl font-bold text-guild-gold">
            {npc.name}
          </h2>
          {npc.role ? (
            <p className="text-xs uppercase tracking-wide text-guild-muted">
              {npc.role}
            </p>
          ) : null}
          <Pill color={isDead ? colors.red : colors.green}>
            {npcStatusLabel(npc)}
          </Pill>
        </div>

        <p className="mx-auto max-w-2xl border-t border-guild-border pt-4 text-sm leading-relaxed text-guild-muted">
          {npc.description}
        </p>
      </section>

      {stats ? (
        <section className={panelled ? "panel space-y-5 p-6" : "space-y-5"}>
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>⚔️ Ficha de combate</Eyebrow>
            <p className="text-right text-xs uppercase tracking-wide text-guild-muted">
              {stats.classOrType || "—"}
              {stats.level !== undefined ? ` · Nv. ${stats.level}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="❤️" label="PV" value={String(stats.pv)} />
            {stats.pm !== undefined ? (
              <StatCard icon="🔵" label="PM" value={String(stats.pm)} />
            ) : null}
            <StatCard icon="🛡️" label="Defesa" value={String(stats.defesa)} />
          </div>

          {stats.atributos ? (
            <div className="space-y-2 border-t border-guild-border pt-4">
              <Eyebrow>Atributos</Eyebrow>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(
                  [
                    ["for", "For"],
                    ["des", "Des"],
                    ["con", "Con"],
                    ["int", "Int"],
                    ["sab", "Sab"],
                    ["car", "Car"],
                  ] as const
                ).map(([key, label]) => (
                  <StatCard
                    key={key}
                    label={label}
                    value={String(stats.atributos![key])}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {stats.resistencias?.length || stats.imunidades?.length ? (
            <div className="grid gap-4 border-t border-guild-border pt-4 sm:grid-cols-2">
              {stats.resistencias?.length ? (
                <div className="space-y-2">
                  <Eyebrow>🛡 Resistências</Eyebrow>
                  <div className="flex flex-wrap gap-2">
                    {stats.resistencias.map((r) => (
                      <Pill key={r} color={colors.goldsoft}>{r}</Pill>
                    ))}
                  </div>
                </div>
              ) : null}
              {stats.imunidades?.length ? (
                <div className="space-y-2">
                  <Eyebrow>☠ Imunidades</Eyebrow>
                  <div className="flex flex-wrap gap-2">
                    {stats.imunidades.map((r) => (
                      <Pill key={r} color={colors.purple}>{r}</Pill>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {stats.pericias?.length ? (
            <div className="space-y-2 border-t border-guild-border pt-4">
              <Eyebrow>🎯 Perícias</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {stats.pericias.map((p) => (
                  <Pill key={p.nome} color={colors.green}>{formatNpcSkill(p)}</Pill>
                ))}
              </div>
            </div>
          ) : null}

          {stats.habilidades?.length ? (
            <div className="space-y-2 border-t border-guild-border pt-4">
              <Eyebrow>✨ Habilidades</Eyebrow>
              <div className="space-y-2 text-sm leading-relaxed text-guild-muted">
                {stats.habilidades.map((h) => (
                  <p key={h.nome}>
                    <strong className="text-guild-gold">{h.nome}</strong>
                    {h.efeito ? ` — ${h.efeito}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {stats.ataques?.length ? (
            <div className="space-y-2 border-t border-guild-border pt-4">
              <Eyebrow>⚔️ Ataques</Eyebrow>
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.ataques.map((a) => (
                  <div
                    key={a.name}
                    className="rounded-lg border border-guild-border bg-guild-border/10 p-3"
                  >
                    <p className="flex items-baseline justify-between gap-2">
                      <strong className="font-heading text-sm text-guild-gold">
                        {a.name}
                      </strong>
                      {a.bonus ? (
                        <span className="shrink-0 text-xs text-guild-muted">
                          {a.bonus}
                        </span>
                      ) : null}
                    </p>
                    {a.damage?.length || a.critico ? (
                      <p className="mt-1 text-xs text-guild-muted">
                        {a.damage?.length ? formatNpcDamage(a.damage) : null}
                        {a.critico ? ` · Crítico ${a.critico}` : ""}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stats.magias?.length ? (
            <div className="space-y-2 border-t border-guild-border pt-4">
              <Eyebrow>🔮 Magias</Eyebrow>
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.magias.map((m) => {
                  const savingThrow = formatNpcSavingThrow(m.resistencia);
                  return (
                    <div
                      key={m.nome}
                      className="rounded-lg border border-guild-border bg-guild-border/10 p-3"
                    >
                      <p className="flex items-baseline justify-between gap-2">
                        <strong className="font-heading text-sm text-guild-gold">
                          {m.nome}
                        </strong>
                        {m.tipo ? (
                          <span className="shrink-0 text-xs text-guild-muted">
                            {m.tipo}
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs text-guild-muted">
                        {m.area ? <p>Área: {m.area}</p> : null}
                        {savingThrow ? <p>Resistência: {savingThrow}</p> : null}
                        {m.resistencia?.sucesso ? (
                          <p>Sucesso: {m.resistencia.sucesso}</p>
                        ) : null}
                        {m.resistencia?.falha ? (
                          <p>Falha: {m.resistencia.falha}</p>
                        ) : null}
                        {m.efeito ? <p>{m.efeito}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
