import type { LooseEnd } from "@/core/entities/loose-end";
import { Pill } from "../ui/Pill";

/** Pílula compacta de fio solto (lista de "Fios Soltos" no rodapé da sessão). */
export function LooseEndTag({ looseEnd }: { looseEnd: LooseEnd }) {
  return (
    <Pill color={looseEnd.color} icon={looseEnd.icon}>
      {looseEnd.title}
    </Pill>
  );
}
