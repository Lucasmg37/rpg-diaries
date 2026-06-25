"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Rastreia se `snapshot` mudou desde a última chamada de `markClean()`.
 * Comparação por JSON.stringify — adequado para snapshots de formulário (não
 * para listas grandes). `markClean()` deve ser chamado depois que o estado
 * "limpo" (carregado/recém-aberto/recém-salvo) já foi commitado — chamar
 * durante o mesmo evento que dispara os `setState` captura o snapshot antigo.
 */
export function useDirtyGuard(snapshot: unknown) {
  const baselineRef = useRef<string>("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(JSON.stringify(snapshot) !== baselineRef.current);
  }, [snapshot]);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function markClean() {
    baselineRef.current = JSON.stringify(snapshot);
    setDirty(false);
  }

  return { dirty, markClean };
}

/** Pede confirmação antes de descartar alterações; `true` libera a ação. */
export function confirmDiscard(dirty: boolean): boolean {
  return !dirty || window.confirm("Há alterações não salvas. Deseja descartá-las?");
}
