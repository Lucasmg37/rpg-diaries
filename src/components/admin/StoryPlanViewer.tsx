"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui";
import type { StoryPlan } from "@/core/entities/story-plan";
import { getStoryPlan, sendJson } from "@/lib/admin-client";

import { LiveNotesPanel } from "./LiveNotesPanel";
import { StoryPlanDocument } from "./StoryPlanDocument";

export function StoryPlanViewer({
  storyPlanId,
  adventureId,
}: {
  storyPlanId: string;
  adventureId: string;
}) {
  const [plan, setPlan] = useState<StoryPlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStoryPlan(adventureId, storyPlanId)
      .then(setPlan)
      .catch((e) => setError((e as Error).message));
  }, [adventureId, storyPlanId]);

  async function handleAddNote(body: string, sceneId?: string) {
    const updated = await sendJson<StoryPlan>(
      `/api/admin/story-plans/${storyPlanId}/notes`,
      "POST",
      { adventureId, body, sceneId },
    );
    setPlan(updated);
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!plan)
    return (
      <p className="py-12 text-center text-sm text-guild-muted">Carregando…</p>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StoryPlanDocument plan={plan} />
      <LiveNotesPanel
        scenes={plan.scenes}
        notes={plan.liveNotes}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
