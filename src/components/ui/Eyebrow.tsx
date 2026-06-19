import type { ReactNode } from "react";

/** Eyebrow — rótulo pequeno em maiúsculas (Cinzel) acima de um título. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}
