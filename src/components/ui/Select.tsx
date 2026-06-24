import type { ReactNode, SelectHTMLAttributes } from "react";

/** Campo de seleção rotulado no estilo do tema. */
export function Select({
  label,
  id,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="text-left">
      <label
        htmlFor={id}
        className="font-heading text-[11px] uppercase tracking-wide text-guild-muted"
      >
        {label}
      </label>
      <select
        id={id}
        className={`mt-1 h-[42px] w-full appearance-none rounded-md border border-guild-border bg-guild-bg1/60 px-3 py-2 text-guild-gold outline-none focus:border-guild-goldsoft ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
