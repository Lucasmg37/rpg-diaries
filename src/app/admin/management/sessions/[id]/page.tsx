"use client";

import { use } from "react";

import { SessionForm } from "@/components/admin/SessionForm";

export default function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SessionForm sessionId={id} />;
}
