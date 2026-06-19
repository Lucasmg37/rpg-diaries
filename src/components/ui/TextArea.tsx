import type { TextareaHTMLAttributes } from "react";

/** Campo de texto multilinha rotulado no estilo do tema. */
export function TextArea({
  label,
  id,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  id: string;
}) {
  return (
    <div className="text-left">
      <label
        htmlFor={id}
        className="font-heading text-[11px] uppercase tracking-wide text-guild-muted"
      >
        {label}
      </label>
      <textarea
        id={id}
        className={`mt-1 w-full rounded-md border border-guild-border bg-guild-bg1/60 px-3 py-2 text-guild-gold outline-none focus:border-guild-goldsoft ${className}`}
        {...props}
      />
    </div>
  );
}
