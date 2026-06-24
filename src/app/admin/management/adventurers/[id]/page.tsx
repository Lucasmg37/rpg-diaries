"use client";

import { use } from "react";

import { AdventurerDetail } from "@/components/admin/AdventurerDetail";

export default function AdventurerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AdventurerDetail adventurerId={id} />;
}
