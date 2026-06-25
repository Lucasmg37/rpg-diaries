"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { randomGuildMessage } from "@/lib/guild-messages";

export function RandomMessageButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  function handleOpen() {
    setMessage(randomGuildMessage());
    setOpen(true);
  }

  return (
    <>
      <Button onClick={handleOpen}>🎲 Mensagem da Guilda</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Sabedoria da Guilda">
        <p className="text-center text-lg leading-relaxed text-guild-muted">
          {message}
        </p>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setMessage(randomGuildMessage())}>
            Sortear outra
          </Button>
        </div>
      </Modal>
    </>
  );
}
