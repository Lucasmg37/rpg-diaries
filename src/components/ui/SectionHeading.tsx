import { Eyebrow } from "./Eyebrow";

/** SectionHeading — eyebrow opcional + título de seção, centralizado. */
export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="text-center">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-1 font-heading text-xl text-guild-gold">{title}</h2>
    </div>
  );
}
