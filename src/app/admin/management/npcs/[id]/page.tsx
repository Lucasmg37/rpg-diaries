"use client";

import { useSearchParams } from "next/navigation";
import { use } from "react";

import { Alert } from "@/components/ui";
import { NpcDetail } from "@/components/admin/NpcDetail";

export default function NpcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const adventureId = searchParams.get("adventureId");

  if (!adventureId) {
    return <Alert tone="error">Parâmetro adventureId é obrigatório na URL.</Alert>;
  }

  return <NpcDetail npcId={id} adventureId={adventureId} />;
}
