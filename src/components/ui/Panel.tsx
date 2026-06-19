import type { CSSProperties, ReactNode } from "react";

/**
 * Panel — contêiner base do tema (borda dourada + fundo translúcido escuro).
 * Para cards clicáveis, use a classe utilitária `.panel` diretamente em `<Link>`.
 */
export function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`panel ${className}`} style={style}>
      {children}
    </div>
  );
}
