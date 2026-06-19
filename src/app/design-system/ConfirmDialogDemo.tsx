"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** Demonstração isolada (client) do ConfirmDialog para a página estática do design system. */
export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Excluir item
      </Button>
      <ConfirmDialog
        open={open}
        title="Excluir item"
        description='Esta ação é irreversível. Para confirmar, digite "exemplo" abaixo.'
        confirmText="exemplo"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
