import type { Tag } from "@/core/entities/session";
import { Pill } from "../ui/Pill";

/** Etiqueta de destaque de uma sessão (pílula colorida). */
export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <Pill color={tag.color} icon={tag.icon}>
      {tag.label}
    </Pill>
  );
}
