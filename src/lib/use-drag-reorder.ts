"use client";

import { useEffect, useState } from "react";

/**
 * Reordenação por arraste (HTML5 DnD nativo, sem libs). `items` é a lista
 * "oficial" (vinda do servidor); enquanto o usuário arrasta, mantemos uma
 * ordem local otimista e só chamamos `onCommit` ao soltar. `localOrder` é
 * descartado sempre que `items` muda de novo (ex.: após o reload pós-commit).
 */
export function useDragReorder<T extends { id: string }>(
  items: T[],
  onCommit: (orderedIds: string[]) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<T[] | null>(null);

  useEffect(() => {
    setLocalOrder(null);
  }, [items]);

  const list = localOrder ?? items;

  function dragPropsFor(id: string) {
    return {
      draggable: true,
      onDragStart: () => {
        setDragId(id);
        setLocalOrder(items);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragId || dragId === id) return;
        setLocalOrder((prev) => {
          const current = prev ?? items;
          const from = current.findIndex((i) => i.id === dragId);
          const to = current.findIndex((i) => i.id === id);
          if (from === -1 || to === -1 || from === to) return current;
          const next = [...current];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
      },
      onDragEnd: () => {
        if (localOrder) onCommit(localOrder.map((i) => i.id));
        setDragId(null);
      },
    };
  }

  return { list, dragPropsFor };
}
