"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Eyebrow,
  Field,
  Panel,
  Select,
  TextArea,
} from "@/components/ui";
import type {
  Scene,
  SceneBlock,
  SceneChoice,
  StoryPlan,
} from "@/core/entities/story-plan";
import type { FullGuild } from "@/core/entities/views";
import { getAdminGuild, listStoryPlans, sendJson } from "@/lib/admin-client";

const BLOCK_LABELS: Record<SceneBlock["type"], string> = {
  clue: "Pista",
  test: "Teste / combate",
  secret: "Segredo do mestre",
  danger: "Risco",
  choices: "Escolhas do grupo",
};

function defaultBlockFor(type: SceneBlock["type"]): SceneBlock {
  switch (type) {
    case "clue":
      return { type: "clue", body: "" };
    case "test":
      return { type: "test", variant: "test", tag: "Teste", body: "" };
    case "secret":
      return { type: "secret", label: "🔒 Segredo (mestre)", body: "" };
    case "danger":
      return { type: "danger", label: "⚠ Risco", body: "" };
    case "choices":
      return { type: "choices", choices: [] };
  }
}

function emptyScene(): Scene {
  return { id: "", icon: "🗺️", title: "", meta: "", blocks: [] };
}

interface FormState {
  title: string;
  eyebrow: string;
  subtitle: string;
  order: number;
  reward: string;
  loreBannerLabel: string;
  loreBannerBody: string;
  loreBannerTags: string;
  scenes: Scene[];
}

const EMPTY_FORM: FormState = {
  title: "",
  eyebrow: "Notas do mestre · uso exclusivo",
  subtitle: "",
  order: 1,
  reward: "",
  loreBannerLabel: "",
  loreBannerBody: "",
  loreBannerTags: "",
  scenes: [],
};

function planToForm(p: StoryPlan): FormState {
  return {
    title: p.title,
    eyebrow: p.eyebrow,
    subtitle: p.subtitle,
    order: p.order,
    reward: p.reward ?? "",
    loreBannerLabel: p.loreBanner?.label ?? "",
    loreBannerBody: p.loreBanner?.body ?? "",
    loreBannerTags: p.loreBanner?.tags.join(", ") ?? "",
    scenes: p.scenes,
  };
}

export function StoryPlanManager({
  initialAdventureId,
  editId,
}: {
  initialAdventureId?: string;
  editId?: string;
} = {}) {
  const [guild, setGuild] = useState<FullGuild | null>(null);
  const [adventureId, setAdventureId] = useState("");
  const [plans, setPlans] = useState<StoryPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appliedEditId, setAppliedEditId] = useState(false);

  useEffect(() => {
    getAdminGuild()
      .then((g) => {
        setGuild(g);
        const defaultId = initialAdventureId ?? g.adventures[0]?.adventure.id;
        if (defaultId) setAdventureId(defaultId);
      })
      .catch((e) => setError((e as Error).message));
  }, [initialAdventureId]);

  function loadPlans(advId: string) {
    return listStoryPlans(advId)
      .then(setPlans)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    if (adventureId) loadPlans(adventureId);
  }, [adventureId]);

  useEffect(() => {
    if (!editId || appliedEditId) return;
    const plan = plans.find((p) => p.id === editId);
    if (plan) {
      startEdit(plan);
      setAppliedEditId(true);
    }
  }, [plans, editId, appliedEditId]);

  const adventures = useMemo(
    () => guild?.adventures.map((a) => a.adventure) ?? [],
    [guild],
  );

  function startEdit(p: StoryPlan) {
    setEditingId(p.id);
    setForm(planToForm(p));
  }
  function reset() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function addScene() {
    setForm((f) => ({ ...f, scenes: [...f.scenes, emptyScene()] }));
  }
  function removeScene(idx: number) {
    setForm((f) => ({ ...f, scenes: f.scenes.filter((_, i) => i !== idx) }));
  }
  function updateScene(idx: number, patch: Partial<Scene>) {
    setForm((f) => ({
      ...f,
      scenes: f.scenes.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function addBlock(sceneIdx: number, type: SceneBlock["type"]) {
    updateScene(sceneIdx, {
      blocks: [...form.scenes[sceneIdx].blocks, defaultBlockFor(type)],
    });
  }
  function removeBlock(sceneIdx: number, blockIdx: number) {
    updateScene(sceneIdx, {
      blocks: form.scenes[sceneIdx].blocks.filter((_, i) => i !== blockIdx),
    });
  }
  function updateBlock(sceneIdx: number, blockIdx: number, block: SceneBlock) {
    updateScene(sceneIdx, {
      blocks: form.scenes[sceneIdx].blocks.map((b, i) =>
        i === blockIdx ? block : b,
      ),
    });
  }

  function addChoice(sceneIdx: number, blockIdx: number) {
    const block = form.scenes[sceneIdx].blocks[blockIdx];
    if (block.type !== "choices") return;
    updateBlock(sceneIdx, blockIdx, {
      ...block,
      choices: [...block.choices, { title: "", body: "" }],
    });
  }
  function updateChoice(
    sceneIdx: number,
    blockIdx: number,
    choiceIdx: number,
    patch: Partial<SceneChoice>,
  ) {
    const block = form.scenes[sceneIdx].blocks[blockIdx];
    if (block.type !== "choices") return;
    updateBlock(sceneIdx, blockIdx, {
      ...block,
      choices: block.choices.map((c, i) =>
        i === choiceIdx ? { ...c, ...patch } : c,
      ),
    });
  }
  function removeChoice(sceneIdx: number, blockIdx: number, choiceIdx: number) {
    const block = form.scenes[sceneIdx].blocks[blockIdx];
    if (block.type !== "choices") return;
    updateBlock(sceneIdx, blockIdx, {
      ...block,
      choices: block.choices.filter((_, i) => i !== choiceIdx),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const payload = {
      adventureId,
      title: form.title,
      eyebrow: form.eyebrow,
      subtitle: form.subtitle,
      order: form.order,
      reward: form.reward,
      loreBanner:
        form.loreBannerLabel || form.loreBannerBody
          ? {
              label: form.loreBannerLabel,
              body: form.loreBannerBody,
              tags: form.loreBannerTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            }
          : undefined,
      scenes: form.scenes,
    };
    try {
      if (editingId) {
        await sendJson(`/api/admin/story-plans/${editingId}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/story-plans", "POST", payload);
      }
      reset();
      await loadPlans(adventureId);
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
      <h1 className="text-center font-heading text-2xl font-bold text-guild-gold">
        Roteiros do Mestre
      </h1>
      <p className="text-center text-xs text-guild-muted">
        Material sigiloso — visível apenas para o mestre logado.
      </p>

      {adventures.length > 1 ? (
        <Select
          id="sp-adv"
          label="Aventura"
          value={adventureId}
          onChange={(e) => {
            setAdventureId(e.target.value);
            reset();
          }}
        >
          {adventures.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      ) : null}

      <div className="space-y-2">
        {plans.map((p) => (
          <div key={p.id} className="panel flex items-center gap-3 p-4">
            <span className="flex-1">
              <span className="block font-heading text-sm font-semibold text-guild-gold">
                {p.title}
              </span>
              <span className="text-xs text-guild-muted">
                {p.scenes.length} cena(s) · {p.liveNotes.length} nota(s) ao vivo
              </span>
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={`/story-plans/${p.id}?adventureId=${encodeURIComponent(adventureId)}`}
                className="text-xs uppercase tracking-wide text-guild-goldsoft transition-colors hover:text-guild-gold"
              >
                Ver
              </Link>
              <Button type="button" variant="ghost" onClick={() => startEdit(p)}>
                Editar
              </Button>
            </div>
          </div>
        ))}
        {plans.length === 0 ? (
          <p className="py-4 text-center text-xs text-guild-muted">
            Nenhum roteiro cadastrado nesta aventura.
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Panel className="space-y-4 p-6">
          <Eyebrow>{editingId ? "Editar roteiro" : "Novo roteiro"}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="sp-title"
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Field
              id="sp-eyebrow"
              label="Sobrelinha"
              value={form.eyebrow}
              onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
            />
            <Field
              id="sp-subtitle"
              label="Subtítulo"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
            <Field
              id="sp-order"
              label="Ordem"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
          </div>

          <Eyebrow>Banner de lore (opcional)</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="sp-lore-label"
              label="Rótulo"
              value={form.loreBannerLabel}
              onChange={(e) =>
                setForm({ ...form, loreBannerLabel: e.target.value })
              }
            />
            <Field
              id="sp-lore-tags"
              label="Tags (separadas por vírgula)"
              value={form.loreBannerTags}
              onChange={(e) =>
                setForm({ ...form, loreBannerTags: e.target.value })
              }
            />
          </div>
          <TextArea
            id="sp-lore-body"
            label="Texto do banner"
            rows={2}
            value={form.loreBannerBody}
            onChange={(e) => setForm({ ...form, loreBannerBody: e.target.value })}
          />

          <TextArea
            id="sp-reward"
            label="Recompensa / nota de rodapé (opcional)"
            rows={2}
            value={form.reward}
            onChange={(e) => setForm({ ...form, reward: e.target.value })}
          />
        </Panel>

        <Panel className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Cenas</Eyebrow>
            <Button type="button" variant="ghost" onClick={addScene}>
              + Adicionar cena
            </Button>
          </div>

          {form.scenes.map((scene, sceneIdx) => (
            <div
              key={sceneIdx}
              className="space-y-3 rounded-md border border-guild-border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-heading text-xs uppercase tracking-wide text-guild-muted">
                  Cena {sceneIdx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeScene(sceneIdx)}
                >
                  Remover cena
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  id={`sp-scene-${sceneIdx}-icon`}
                  label="Ícone"
                  value={scene.icon}
                  onChange={(e) =>
                    updateScene(sceneIdx, { icon: e.target.value })
                  }
                />
                <Field
                  id={`sp-scene-${sceneIdx}-title`}
                  label="Título"
                  className="sm:col-span-2"
                  value={scene.title}
                  onChange={(e) =>
                    updateScene(sceneIdx, { title: e.target.value })
                  }
                />
                <Field
                  id={`sp-scene-${sceneIdx}-meta`}
                  label="Meta (contexto)"
                  className="sm:col-span-3"
                  value={scene.meta}
                  onChange={(e) =>
                    updateScene(sceneIdx, { meta: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                {scene.blocks.map((block, blockIdx) => (
                  <div
                    key={blockIdx}
                    className="space-y-2 rounded-md border border-guild-border/60 bg-guild-bg1/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-[11px] uppercase tracking-wide text-guild-muted">
                        {BLOCK_LABELS[block.type]}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeBlock(sceneIdx, blockIdx)}
                      >
                        Remover
                      </Button>
                    </div>

                    {block.type === "clue" ? (
                      <TextArea
                        id={`sp-block-${sceneIdx}-${blockIdx}-body`}
                        label="Texto da pista"
                        rows={2}
                        value={block.body}
                        onChange={(e) =>
                          updateBlock(sceneIdx, blockIdx, {
                            ...block,
                            body: e.target.value,
                          })
                        }
                      />
                    ) : null}

                    {block.type === "test" ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Select
                            id={`sp-block-${sceneIdx}-${blockIdx}-variant`}
                            label="Variante"
                            value={block.variant}
                            onChange={(e) =>
                              updateBlock(sceneIdx, blockIdx, {
                                ...block,
                                variant: e.target.value as "test" | "combat",
                              })
                            }
                          >
                            <option value="test">Teste</option>
                            <option value="combat">Combate</option>
                          </Select>
                          <Field
                            id={`sp-block-${sceneIdx}-${blockIdx}-tag`}
                            label="Etiqueta (ex.: Teste — grupo)"
                            value={block.tag}
                            onChange={(e) =>
                              updateBlock(sceneIdx, blockIdx, {
                                ...block,
                                tag: e.target.value,
                              })
                            }
                          />
                        </div>
                        <TextArea
                          id={`sp-block-${sceneIdx}-${blockIdx}-body`}
                          label="Descrição do teste"
                          rows={2}
                          value={block.body}
                          onChange={(e) =>
                            updateBlock(sceneIdx, blockIdx, {
                              ...block,
                              body: e.target.value,
                            })
                          }
                        />
                      </>
                    ) : null}

                    {block.type === "secret" || block.type === "danger" ? (
                      <>
                        <Field
                          id={`sp-block-${sceneIdx}-${blockIdx}-label`}
                          label="Rótulo"
                          value={block.label}
                          onChange={(e) =>
                            updateBlock(sceneIdx, blockIdx, {
                              ...block,
                              label: e.target.value,
                            } as SceneBlock)
                          }
                        />
                        <TextArea
                          id={`sp-block-${sceneIdx}-${blockIdx}-body`}
                          label="Texto"
                          rows={2}
                          value={block.body}
                          onChange={(e) =>
                            updateBlock(sceneIdx, blockIdx, {
                              ...block,
                              body: e.target.value,
                            } as SceneBlock)
                          }
                        />
                      </>
                    ) : null}

                    {block.type === "choices" ? (
                      <div className="space-y-2">
                        {block.choices.map((choice, choiceIdx) => (
                          <div
                            key={choiceIdx}
                            className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
                          >
                            <Field
                              id={`sp-choice-${sceneIdx}-${blockIdx}-${choiceIdx}-title`}
                              label="Opção"
                              value={choice.title}
                              onChange={(e) =>
                                updateChoice(sceneIdx, blockIdx, choiceIdx, {
                                  title: e.target.value,
                                })
                              }
                            />
                            <Field
                              id={`sp-choice-${sceneIdx}-${blockIdx}-${choiceIdx}-body`}
                              label="Consequência"
                              value={choice.body}
                              onChange={(e) =>
                                updateChoice(sceneIdx, blockIdx, choiceIdx, {
                                  body: e.target.value,
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                removeChoice(sceneIdx, blockIdx, choiceIdx)
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => addChoice(sceneIdx, blockIdx)}
                        >
                          + Adicionar opção
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(BLOCK_LABELS) as SceneBlock["type"][]).map(
                    (type) => (
                      <Button
                        key={type}
                        type="button"
                        variant="ghost"
                        onClick={() => addBlock(sceneIdx, type)}
                      >
                        + {BLOCK_LABELS[type]}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          ))}

          {form.scenes.length === 0 ? (
            <p className="py-2 text-center text-xs text-guild-muted">
              Nenhuma cena ainda — adicione a primeira.
            </p>
          ) : null}
        </Panel>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting || !form.title.trim()}>
            {submitting ? "Salvando…" : editingId ? "Salvar" : "Adicionar"}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={reset}>
              Cancelar edição
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
