import type { ReactNode } from "react";

const TONE_CLASSES = {
  neutral: "border-guild-border bg-guild-border/10 text-guild-muted",
  amber: "border-guild-goldsoft bg-guild-goldsoft/10 text-guild-gold",
  purple: "border-guild-purple bg-guild-purple/10 text-guild-gold",
  red: "border-guild-red bg-guild-red/10 text-guild-gold",
  green: "border-guild-green bg-guild-green/10 text-guild-gold",
} as const;

export type CalloutTone = keyof typeof TONE_CLASSES;

/** Callout — caixa de destaque em itálico (usada na linha do tempo e nos blocos de cena). */
export function Callout({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: CalloutTone;
  className?: string;
}) {
  return (
    <p className={`callout ${TONE_CLASSES[tone]} ${className}`}>{children}</p>
  );
}
