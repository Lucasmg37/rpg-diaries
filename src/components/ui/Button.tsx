import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "rounded-md border border-guild-border bg-guild-border/20 px-4 py-2 text-sm text-guild-gold hover:border-guild-goldsoft hover:text-guild-gold",
  ghost: "text-[11px] text-guild-muted hover:text-guild-goldsoft",
  danger:
    "rounded-md border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm text-red-400 hover:border-red-700 hover:text-red-300",
};

/** Botão do tema. `primary` para ações principais, `ghost` para ações sutis. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`font-heading uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
