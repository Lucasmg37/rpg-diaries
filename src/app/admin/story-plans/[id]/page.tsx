"use client";

import { use } from "react";

import { Alert } from "@/components/ui";
import { StoryPlanViewer } from "@/components/admin/StoryPlanViewer";

export default function StoryPlanViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adventureId?: string }>;
}) {
  const { id } = use(params);
  const { adventureId } = use(searchParams);

  if (!adventureId) {
    return <Alert tone="error">Parâmetro adventureId ausente.</Alert>;
  }

  return <StoryPlanViewer storyPlanId={id} adventureId={adventureId} />;
}
