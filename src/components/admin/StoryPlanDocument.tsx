import type { CSSProperties } from "react";

import { Callout, Eyebrow, Ornament, Panel, Pill } from "@/components/ui";
import { colors } from "@/components/ui/tokens";
import type { Scene, SceneBlock, StoryPlan } from "@/core/entities/story-plan";

function renderBlock(block: SceneBlock, key: number) {
  switch (block.type) {
    case "clue":
      return <Callout key={key}>{block.body}</Callout>;
    case "test":
      return (
        <Callout key={key} tone="amber">
          <Pill color={colors.goldsoft} className="not-italic mr-2">
            {block.tag}
          </Pill>
          {block.body}
        </Callout>
      );
    case "secret":
      return (
        <Callout key={key} tone="purple">
          <strong className="mb-1 block font-heading text-[10px] not-italic uppercase tracking-wide">
            {block.label}
          </strong>
          {block.body}
        </Callout>
      );
    case "danger":
      return (
        <Callout key={key} tone="red">
          <strong className="mb-1 block font-heading text-[10px] not-italic uppercase tracking-wide">
            {block.label}
          </strong>
          {block.body}
        </Callout>
      );
    case "choices":
      return (
        <div key={key} className="grid gap-3 sm:grid-cols-2">
          {block.choices.map((choice, i) => (
            <Panel key={i} className="p-3">
              <p className="mb-1 font-heading text-xs font-semibold text-guild-gold">
                {choice.title}
              </p>
              <p className="text-sm leading-relaxed text-guild-muted">
                {choice.body}
              </p>
            </Panel>
          ))}
        </div>
      );
  }
}

function SceneSection({ scene }: { scene: Scene }) {
  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-guild-border bg-guild-bg2 text-base">
          <span aria-hidden>{scene.icon}</span>
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-guild-gold">
            {scene.title}
          </p>
          <p className="text-xs text-guild-muted">{scene.meta}</p>
        </div>
      </div>
      <div className="space-y-2 pl-12">
        {scene.blocks.map((block, i) => renderBlock(block, i))}
      </div>
    </div>
  );
}

/** Documento do roteiro do mestre — visualização sigilosa, no padrão visual do diário. */
export function StoryPlanDocument({ plan }: { plan: StoryPlan }) {
  return (
    <article className="space-y-6">
      <header className="border-b border-guild-border pb-5 text-center">
        <Eyebrow>{plan.eyebrow}</Eyebrow>
        <h1 className="mt-1 font-heading text-2xl font-bold text-guild-gold">
          {plan.title}
        </h1>
        {plan.subtitle ? (
          <p className="mt-1.5 text-sm italic text-guild-muted">
            {plan.subtitle}
          </p>
        ) : null}
      </header>

      {plan.loreBanner ? (
        <Panel
          className="space-y-2 p-4"
          style={
            {
              borderColor: `${colors.purple}66`,
              backgroundColor: `${colors.purple}14`,
            } as CSSProperties
          }
        >
          <p className="font-heading text-[10px] uppercase tracking-[2px] text-guild-purple">
            {plan.loreBanner.label}
          </p>
          <p className="text-sm leading-relaxed text-guild-gold">
            {plan.loreBanner.body}
          </p>
          {plan.loreBanner.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {plan.loreBanner.tags.map((tag, i) => (
                <Pill key={i} color={colors.purple}>
                  {tag}
                </Pill>
              ))}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {plan.scenes.map((scene, i) => (
        <div key={scene.id}>
          {i > 0 ? <Ornament className="my-6" /> : null}
          <SceneSection scene={scene} />
        </div>
      ))}

      {plan.reward ? (
        <Callout tone="green" className="not-italic text-center">
          {plan.reward}
        </Callout>
      ) : null}
    </article>
  );
}
