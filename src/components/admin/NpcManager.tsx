"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Eyebrow,
  Field,
  Modal,
  Select,
  TextArea,
} from "@/components/ui";
import type {
  AtributoKey,
  Npc,
  NpcAttack,
  NpcAttributes,
  NpcKind,
  NpcSkill,
  NpcSpell,
} from "@/core/entities/npc";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, listAdminNpcs, sendJson } from "@/lib/admin-client";
import { npcKindLabel, npcStatusLabel } from "@/lib/npc-view";

const ATRIBUTOS: { key: AtributoKey; label: string }[] = [
  { key: "for", label: "For" },
  { key: "des", label: "Des" },
  { key: "con", label: "Con" },
  { key: "int", label: "Int" },
  { key: "sab", label: "Sab" },
  { key: "car", label: "Car" },
];

const EMPTY_ATTRIBUTES: NpcAttributes = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

/** Linha de magia no formulário — a resistência (teste) fica achatada nos mesmos campos. */
interface SpellRow {
  nome: string;
  tipo: string;
  area: string;
  atributo: AtributoKey | "";
  cd: string;
  sucesso: string;
  falha: string;
  efeito: string;
}

const EMPTY_SPELL: SpellRow = {
  nome: "",
  tipo: "",
  area: "",
  atributo: "",
  cd: "",
  sucesso: "",
  falha: "",
  efeito: "",
};

const EMPTY = {
  kind: "npc" as NpcKind,
  name: "",
  icon: "🧙",
  role: "",
  description: "",
  masterNotes: "",
  sheetUrl: "",
  pv: 0,
  defesa: 0,
  level: "",
  classOrType: "",
  resistencias: "",
  imunidades: "",
  atributos: { ...EMPTY_ATTRIBUTES },
  pericias: [] as NpcSkill[],
  habilidades: [] as { nome: string; efeito: string }[],
  ataques: [] as NpcAttack[],
  magias: [] as SpellRow[],
};

function toList(s: string): string[] | undefined {
  const list = s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export function NpcManager() {
  const router = useRouter();
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [adventureId, setAdventureId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  function loadGuild() {
    return getAdminGuild()
      .then((g) => {
        setGuild(g);
        if (!adventureId && g.adventures[0]) {
          setAdventureId(g.adventures[0].adventure.id);
        }
      })
      .catch((e) => setError((e as Error).message));
  }

  function loadNpcs(id: string) {
    return listAdminNpcs(id)
      .then(setNpcs)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    loadGuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adventureId) loadNpcs(adventureId);
  }, [adventureId]);

  const adventure = useMemo(
    () => guild?.adventures.find((a) => a.adventure.id === adventureId),
    [guild, adventureId],
  );

  function startEdit(n: Npc) {
    setEditingId(n.id);
    setForm({
      kind: n.kind,
      name: n.name,
      icon: n.icon ?? "🧙",
      role: n.role ?? "",
      description: n.description,
      masterNotes: n.masterNotes ?? "",
      sheetUrl: n.sheetUrl ?? "",
      pv: n.stats?.pv ?? 0,
      defesa: n.stats?.defesa ?? 0,
      level: n.stats?.level !== undefined ? String(n.stats.level) : "",
      classOrType: n.stats?.classOrType ?? "",
      resistencias: n.stats?.resistencias?.join(", ") ?? "",
      imunidades: n.stats?.imunidades?.join(", ") ?? "",
      atributos: n.stats?.atributos ?? { ...EMPTY_ATTRIBUTES },
      pericias: n.stats?.pericias ?? [],
      habilidades: (n.stats?.habilidades ?? []).map((h) => ({
        nome: h.nome,
        efeito: h.efeito ?? "",
      })),
      ataques: n.stats?.ataques ?? [],
      magias: (n.stats?.magias ?? []).map((m) => ({
        nome: m.nome,
        tipo: m.tipo ?? "",
        area: m.area ?? "",
        atributo: m.resistencia?.atributo ?? "",
        cd: m.resistencia?.cd !== undefined ? String(m.resistencia.cd) : "",
        sucesso: m.resistencia?.sucesso ?? "",
        falha: m.resistencia?.falha ?? "",
        efeito: m.efeito ?? "",
      })),
    });
    setFormOpen(true);
  }
  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY, atributos: { ...EMPTY_ATTRIBUTES } });
  }
  function closeForm() {
    reset();
    setFormOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = {
      adventureId,
      kind: form.kind,
      name: form.name,
      icon: form.icon,
      role: form.role || undefined,
      description: form.description,
      masterNotes: form.masterNotes || undefined,
      sheetUrl: form.sheetUrl || undefined,
      stats:
        form.classOrType || form.pv || form.defesa
          ? {
              classOrType: form.classOrType,
              level: form.level ? Number(form.level) : undefined,
              pv: form.pv,
              defesa: form.defesa,
              resistencias: toList(form.resistencias),
              imunidades: toList(form.imunidades),
              atributos: form.atributos,
              pericias: form.pericias.length
                ? form.pericias.filter((p) => p.nome.trim())
                : undefined,
              habilidades: form.habilidades.length
                ? form.habilidades
                    .filter((h) => h.nome.trim())
                    .map((h) => ({ nome: h.nome, efeito: h.efeito || undefined }))
                : undefined,
              ataques: form.ataques.length
                ? form.ataques.filter((a) => a.name.trim())
                : undefined,
              magias: form.magias.length
                ? form.magias
                    .filter((m) => m.nome.trim())
                    .map((m): NpcSpell => {
                      const resistencia =
                        m.atributo || m.cd || m.sucesso || m.falha
                          ? {
                              atributo: (m.atributo || undefined) as AtributoKey | undefined,
                              cd: m.cd ? Number(m.cd) : undefined,
                              sucesso: m.sucesso || undefined,
                              falha: m.falha || undefined,
                            }
                          : undefined;
                      return {
                        nome: m.nome,
                        tipo: m.tipo || undefined,
                        area: m.area || undefined,
                        resistencia,
                        efeito: m.efeito || undefined,
                      };
                    })
                : undefined,
            }
          : undefined,
    };
    try {
      if (editingId) {
        await sendJson(`/api/admin/npcs/${editingId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/npcs", "POST", payload);
      }
      closeForm();
      await loadNpcs(adventureId);
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
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-guild-gold">
          NPCs &amp; Bosses
        </h1>
        <Button
          type="button"
          onClick={() => {
            reset();
            setFormOpen(true);
          }}
        >
          + Novo NPC/Boss
        </Button>
      </div>

      {guild.adventures.length > 1 ? (
        <Select
          id="npc-adv"
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
        {npcs.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/admin/management/npcs/${n.id}?adventureId=${adventureId}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                router.push(`/admin/management/npcs/${n.id}?adventureId=${adventureId}`);
            }}
            className="panel flex cursor-pointer items-center gap-3 p-4 transition-colors hover:border-guild-goldsoft"
          >
            <span className="text-xl" aria-hidden>
              {n.icon ?? (n.kind === "boss" ? "👹" : "🧙")}
            </span>
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {n.name}
              </span>
              <span className="text-xs text-guild-muted">
                {npcKindLabel(n)} · {npcStatusLabel(n)}
                {n.role ? ` · ${n.role}` : ""}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                startEdit(n);
              }}
            >
              Editar
            </Button>
          </div>
        ))}
        {npcs.length === 0 ? (
          <p className="text-sm text-guild-muted">
            Nenhum NPC/Boss cadastrado{adventure ? ` em ${adventure.adventure.name}` : ""} ainda.
          </p>
        ) : null}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Editar NPC/Boss" : "Novo NPC/Boss"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="npc-kind"
              label="Tipo"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as NpcKind })}
            >
              <option value="npc">NPC</option>
              <option value="boss">Boss</option>
            </Select>
            <Field
              id="npc-name"
              label="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Field
              id="npc-icon"
              label="Ícone"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <Field
              id="npc-role"
              label="Papel (ex.: Comerciante de Korad)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Field
              id="npc-sheet"
              label="URL da ficha completa"
              value={form.sheetUrl}
              onChange={(e) => setForm({ ...form, sheetUrl: e.target.value })}
            />
          </div>

          <TextArea
            id="npc-desc"
            label="Descrição (pública — personalidade, história)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextArea
            id="npc-master-notes"
            label="Notas do mestre (sigiloso — nunca aparece para os jogadores)"
            rows={3}
            value={form.masterNotes}
            onChange={(e) => setForm({ ...form, masterNotes: e.target.value })}
          />

          <Eyebrow className="block">
            Ficha resumida (Tormenta) — para consulta rápida na mesa. Vale para NPCs e Bosses.
          </Eyebrow>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              id="npc-classortype"
              label="Classe/Tipo"
              value={form.classOrType}
              onChange={(e) => setForm({ ...form, classOrType: e.target.value })}
            />
            <Field
              id="npc-level"
              label="Nível"
              type="number"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            />
            <Field
              id="npc-pv"
              label="PV"
              type="number"
              value={form.pv}
              onChange={(e) => setForm({ ...form, pv: Number(e.target.value) })}
            />
            <Field
              id="npc-defesa"
              label="Defesa"
              type="number"
              value={form.defesa}
              onChange={(e) => setForm({ ...form, defesa: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Eyebrow className="block">Atributos</Eyebrow>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ATRIBUTOS.map(({ key, label }) => (
                <Field
                  key={key}
                  id={`npc-atr-${key}`}
                  label={label}
                  type="number"
                  value={form.atributos[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      atributos: { ...form.atributos, [key]: Number(e.target.value) },
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="npc-resistencias"
              label="Resistências (separadas por vírgula)"
              value={form.resistencias}
              onChange={(e) => setForm({ ...form, resistencias: e.target.value })}
            />
            <Field
              id="npc-imunidades"
              label="Imunidades (separadas por vírgula)"
              value={form.imunidades}
              onChange={(e) => setForm({ ...form, imunidades: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Eyebrow className="block">Perícias (bônus já calculado)</Eyebrow>
            {form.pericias.map((p, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <Field
                  id={`npc-per-nome-${i}`}
                  label="Nome"
                  value={p.nome}
                  onChange={(e) => {
                    const pericias = [...form.pericias];
                    pericias[i] = { ...p, nome: e.target.value };
                    setForm({ ...form, pericias });
                  }}
                />
                <Select
                  id={`npc-per-atr-${i}`}
                  label="Atributo"
                  value={p.atributo ?? ""}
                  onChange={(e) => {
                    const pericias = [...form.pericias];
                    pericias[i] = {
                      ...p,
                      atributo: (e.target.value || undefined) as AtributoKey | undefined,
                    };
                    setForm({ ...form, pericias });
                  }}
                >
                  <option value="">—</option>
                  {ATRIBUTOS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Field
                  id={`npc-per-bonus-${i}`}
                  label="Bônus"
                  type="number"
                  value={p.bonus}
                  onChange={(e) => {
                    const pericias = [...form.pericias];
                    pericias[i] = { ...p, bonus: Number(e.target.value) };
                    setForm({ ...form, pericias });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm({ ...form, pericias: form.pericias.filter((_, j) => j !== i) })
                  }
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  ...form,
                  pericias: [...form.pericias, { nome: "", bonus: 0 }],
                })
              }
            >
              + Adicionar perícia
            </Button>
          </div>

          <div className="space-y-2">
            <Eyebrow className="block">
              Habilidades (descreva o impacto/dano — ex.: &quot;Falha em Fortitude: 1d6 de dano e
              atordoado&quot;)
            </Eyebrow>
            {form.habilidades.map((h, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <Field
                  id={`npc-hab-nome-${i}`}
                  label="Nome"
                  value={h.nome}
                  onChange={(e) => {
                    const habilidades = [...form.habilidades];
                    habilidades[i] = { ...h, nome: e.target.value };
                    setForm({ ...form, habilidades });
                  }}
                />
                <Field
                  id={`npc-hab-efeito-${i}`}
                  label="Efeito/dano"
                  value={h.efeito}
                  onChange={(e) => {
                    const habilidades = [...form.habilidades];
                    habilidades[i] = { ...h, efeito: e.target.value };
                    setForm({ ...form, habilidades });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm({ ...form, habilidades: form.habilidades.filter((_, j) => j !== i) })
                  }
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  ...form,
                  habilidades: [...form.habilidades, { nome: "", efeito: "" }],
                })
              }
            >
              + Adicionar habilidade
            </Button>
          </div>

          <div className="space-y-2">
            <Eyebrow className="block">
              Ataques / Armas (dano pode somar tipos distintos — ex.: 1d6 cortante + 1d6 ácido)
            </Eyebrow>
            {form.ataques.map((atk, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-guild-border p-3">
                <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field
                    id={`npc-atk-name-${i}`}
                    label="Nome"
                    value={atk.name}
                    onChange={(e) => {
                      const ataques = [...form.ataques];
                      ataques[i] = { ...atk, name: e.target.value };
                      setForm({ ...form, ataques });
                    }}
                  />
                  <Field
                    id={`npc-atk-bonus-${i}`}
                    label="Bônus"
                    value={atk.bonus ?? ""}
                    onChange={(e) => {
                      const ataques = [...form.ataques];
                      ataques[i] = { ...atk, bonus: e.target.value };
                      setForm({ ...form, ataques });
                    }}
                  />
                  <Field
                    id={`npc-atk-critico-${i}`}
                    label="Crítico"
                    value={atk.critico ?? ""}
                    onChange={(e) => {
                      const ataques = [...form.ataques];
                      ataques[i] = { ...atk, critico: e.target.value };
                      setForm({ ...form, ataques });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setForm({ ...form, ataques: form.ataques.filter((_, j) => j !== i) })
                    }
                  >
                    Remover
                  </Button>
                </div>

                <div className="space-y-1 pl-2">
                  <Eyebrow className="block">Dano</Eyebrow>
                  {(atk.damage ?? []).map((d, j) => (
                    <div key={j} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Field
                        id={`npc-atk-${i}-dmg-dado-${j}`}
                        label="Dado (ex.: 1d6)"
                        value={d.dado}
                        onChange={(e) => {
                          const ataques = [...form.ataques];
                          const damage = [...(atk.damage ?? [])];
                          damage[j] = { ...d, dado: e.target.value };
                          ataques[i] = { ...atk, damage };
                          setForm({ ...form, ataques });
                        }}
                      />
                      <Field
                        id={`npc-atk-${i}-dmg-tipo-${j}`}
                        label="Tipo (ex.: ácido)"
                        value={d.tipo ?? ""}
                        onChange={(e) => {
                          const ataques = [...form.ataques];
                          const damage = [...(atk.damage ?? [])];
                          damage[j] = { ...d, tipo: e.target.value };
                          ataques[i] = { ...atk, damage };
                          setForm({ ...form, ataques });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const ataques = [...form.ataques];
                          ataques[i] = {
                            ...atk,
                            damage: (atk.damage ?? []).filter((_, k) => k !== j),
                          };
                          setForm({ ...form, ataques });
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const ataques = [...form.ataques];
                      ataques[i] = {
                        ...atk,
                        damage: [...(atk.damage ?? []), { dado: "", tipo: "" }],
                      };
                      setForm({ ...form, ataques });
                    }}
                  >
                    + Adicionar componente de dano
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  ...form,
                  ataques: [...form.ataques, { name: "", bonus: "", damage: [], critico: "" }],
                })
              }
            >
              + Adicionar ataque
            </Button>
          </div>

          <div className="space-y-2">
            <Eyebrow className="block">
              Magias (tipo, área de efeito e teste de resistência para esquivar)
            </Eyebrow>
            {form.magias.map((m, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-guild-border p-3">
                <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field
                    id={`npc-spell-nome-${i}`}
                    label="Nome"
                    value={m.nome}
                    onChange={(e) => {
                      const magias = [...form.magias];
                      magias[i] = { ...m, nome: e.target.value };
                      setForm({ ...form, magias });
                    }}
                  />
                  <Field
                    id={`npc-spell-tipo-${i}`}
                    label="Tipo (ex.: Evocação)"
                    value={m.tipo}
                    onChange={(e) => {
                      const magias = [...form.magias];
                      magias[i] = { ...m, tipo: e.target.value };
                      setForm({ ...form, magias });
                    }}
                  />
                  <Field
                    id={`npc-spell-area-${i}`}
                    label="Área (ex.: Cone 9m)"
                    value={m.area}
                    onChange={(e) => {
                      const magias = [...form.magias];
                      magias[i] = { ...m, area: e.target.value };
                      setForm({ ...form, magias });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setForm({ ...form, magias: form.magias.filter((_, j) => j !== i) })
                    }
                  >
                    Remover
                  </Button>
                </div>

                <div className="space-y-1 pl-2">
                  <Eyebrow className="block">Resistência (forma de esquivar)</Eyebrow>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <Select
                      id={`npc-spell-atributo-${i}`}
                      label="Atributo"
                      value={m.atributo}
                      onChange={(e) => {
                        const magias = [...form.magias];
                        magias[i] = { ...m, atributo: e.target.value as AtributoKey | "" };
                        setForm({ ...form, magias });
                      }}
                    >
                      <option value="">—</option>
                      {ATRIBUTOS.map(({ key, label }) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <Field
                      id={`npc-spell-cd-${i}`}
                      label="CD"
                      type="number"
                      value={m.cd}
                      onChange={(e) => {
                        const magias = [...form.magias];
                        magias[i] = { ...m, cd: e.target.value };
                        setForm({ ...form, magias });
                      }}
                    />
                    <Field
                      id={`npc-spell-sucesso-${i}`}
                      label="Se passar"
                      value={m.sucesso}
                      onChange={(e) => {
                        const magias = [...form.magias];
                        magias[i] = { ...m, sucesso: e.target.value };
                        setForm({ ...form, magias });
                      }}
                    />
                    <Field
                      id={`npc-spell-falha-${i}`}
                      label="Se falhar"
                      value={m.falha}
                      onChange={(e) => {
                        const magias = [...form.magias];
                        magias[i] = { ...m, falha: e.target.value };
                        setForm({ ...form, magias });
                      }}
                    />
                  </div>
                  <Field
                    id={`npc-spell-efeito-${i}`}
                    label="Efeito/dano geral"
                    value={m.efeito}
                    onChange={(e) => {
                      const magias = [...form.magias];
                      magias[i] = { ...m, efeito: e.target.value };
                      setForm({ ...form, magias });
                    }}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm({ ...form, magias: [...form.magias, { ...EMPTY_SPELL }] })}
            >
              + Adicionar magia
            </Button>
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={submitting || !form.name.trim()}>
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
