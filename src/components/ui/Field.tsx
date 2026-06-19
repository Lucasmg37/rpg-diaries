import type { InputHTMLAttributes } from "react";

/** Campo de formulário rotulado (label + input) no estilo do tema. */
export function Field({
  label,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="text-left">
      <label
        htmlFor={id}
        className="font-heading text-[11px] uppercase tracking-wide text-guild-muted"
      >
        {label}
      </label>
      <input
        id={id}
        className={`mt-1 w-full rounded-md border border-guild-border bg-guild-bg1/60 px-3 py-2 text-guild-gold outline-none focus:border-guild-goldsoft ${className}`}
        {...props}
      />
    </div>
  );
}
