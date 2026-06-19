"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { Ornament } from "@/components/ui/Ornament";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.replace("/admin/dashboard");
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Falha no login.");
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="panel space-y-5 p-8 text-center">
        <div>
          <Eyebrow>Acesso restrito</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold text-guild-gold">
            Área do Mestre
          </h1>
          <Ornament className="my-4" />
          <p className="text-sm text-guild-muted">
            Informe a senha do Mestre para acessar o painel.
          </p>
        </div>

        <Field
          id="password"
          label="Senha"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}

        <Button
          type="submit"
          disabled={loading || password.length === 0}
          className="w-full"
        >
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-guild-muted">
        <Link
          href="/"
          className="transition-colors hover:text-guild-goldsoft"
        >
          ← Voltar ao diário
        </Link>
      </p>
    </div>
  );
}
