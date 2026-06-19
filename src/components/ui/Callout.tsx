import type { ReactNode } from "react";

/** Callout — caixa de destaque em itálico (usada na linha do tempo). */
export function Callout({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`callout ${className}`}>{children}</p>;
}
