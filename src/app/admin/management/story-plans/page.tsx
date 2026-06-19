"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { StoryPlanManager } from "@/components/admin/StoryPlanManager";

function StoryPlansPageContent() {
  const params = useSearchParams();
  return (
    <StoryPlanManager
      initialAdventureId={params.get("adventureId") ?? undefined}
      editId={params.get("edit") ?? undefined}
    />
  );
}

export default function StoryPlansPage() {
  return (
    <Suspense fallback={null}>
      <StoryPlansPageContent />
    </Suspense>
  );
}
