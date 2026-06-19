import type { ReactNode } from "react";

import { tint } from "./tokens";

/**
 * Pill — pílula colorida derivada de uma cor de acento (hex). Tinge o fundo e a
 * borda automaticamente. Base de TagBadge e LooseEndTag.
 */
export function Pill({
  color,
  icon,
  children,
  className = "",
}: {
  color: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-heading text-[11px] tracking-wide ${className}`}
      style={{
        color,
        borderColor: `${color}${tint.border}`,
        backgroundColor: `${color}${tint.bg}`,
      }}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}
