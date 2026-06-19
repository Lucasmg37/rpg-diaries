import type { ReactNode } from "react";

/**
 * Panel — contêiner base do tema (borda dourada + fundo translúcido escuro).
 * Para cards clicáveis, use a classe utilitária `.panel` diretamente em `<Link>`.
 */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
}
