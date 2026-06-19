import type { ReactNode } from "react";

type Tone = "error" | "info";

const TONES: Record<Tone, string> = {
  error: "border-guild-danger bg-guild-danger/15 text-guild-red",
  info: "border-guild-border bg-guild-border/10 text-guild-muted",
};

/** Caixa de mensagem (erro ou informação) no estilo do tema. */
export function Alert({
  tone = "error",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={`rounded-md border px-3 py-2 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
