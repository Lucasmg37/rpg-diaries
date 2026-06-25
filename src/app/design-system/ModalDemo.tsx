"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

/** Demonstração isolada (client) do Modal para a página estática do design system. */
export function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo item">
        <Field id="ds-modal-name" label="Nome" placeholder="Ex.: Espada longa" />
        <div className="flex items-center gap-4">
          <Button type="button" onClick={() => setOpen(false)}>
            Adicionar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  );
}
