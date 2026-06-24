import type { ReactNode } from "react";

/** Opção selecionável em formato de "caixa" no lugar de um checkbox nativo. */
export function CheckboxOption({
  checked,
  onChange,
  children,
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
        checked
          ? "border-guild-goldsoft bg-guild-gold/15 text-guild-gold"
          : "border-guild-border text-guild-muted hover:border-guild-goldsoft/60"
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}
