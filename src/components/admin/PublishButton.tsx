"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { sendJson } from "@/lib/admin-client";

/**
 * Dispara o Vercel Deploy Hook via /api/admin/publish. A Vercel cria o job de
 * deploy imediatamente — sem polling; mostramos só a confirmação.
 */
export function PublishButton() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handlePublish() {
    setStatus("sending");
    setMessage("");
    try {
      await sendJson("/api/admin/publish", "POST", {});
      setStatus("done");
      setMessage("Deploy disparado — acompanhe em Deployments na Vercel.");
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handlePublish}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Publicando…" : "🚀 Publicar"}
      </Button>
      {message ? (
        <Alert tone={status === "error" ? "error" : "info"}>{message}</Alert>
      ) : null}
    </div>
  );
}
