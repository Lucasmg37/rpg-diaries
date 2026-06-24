"use client";

import { useState } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Diálogo de confirmação para ações destrutivas. Exige que o usuário digite
 * o nome da entidade (`confirmText`) antes de habilitar o botão de exclusão,
 * para evitar cliques acidentais em exclusões irreversíveis.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmLabel = "Excluir",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");

  const matches = typed.trim() === confirmText.trim();

  function handleCancel() {
    setTyped("");
    onCancel();
  }

  function handleConfirm() {
    if (!matches) return;
    onConfirm();
  }

  return (
    <Modal open={open} onClose={handleCancel} maxWidth="max-w-md">
      <h2 className="font-heading text-lg font-bold text-red-400">
        {title}
      </h2>
      <p className="text-sm text-guild-muted">{description}</p>
      <p className="text-xs text-guild-muted">
        Para confirmar, digite{" "}
        <span className="font-semibold text-guild-gold">{confirmText}</span>{" "}
        abaixo:
      </p>
      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="w-full rounded-md border border-guild-border bg-guild-bg1/60 px-3 py-2 text-sm text-guild-gold outline-none focus:border-guild-goldsoft"
        placeholder={confirmText}
      />
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!matches || busy}
          onClick={handleConfirm}
        >
          {busy ? "Excluindo…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
