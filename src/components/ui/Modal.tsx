"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { Panel } from "./Panel";

/**
 * Modal genérico — overlay + Panel, fecha ao clicar fora ou pressionar Esc.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Panel
        className={`w-full ${maxWidth} space-y-4 p-6`}
        style={{ cursor: "auto" }}
      >
        <div onClick={(e) => e.stopPropagation()} className="space-y-4">
          {title ? (
            <h2 className="font-heading text-lg font-bold text-guild-gold">
              {title}
            </h2>
          ) : null}
          {children}
        </div>
      </Panel>
    </div>
  );
}
