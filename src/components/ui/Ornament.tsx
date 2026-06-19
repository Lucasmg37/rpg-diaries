/** Ornament — divisória decorativa com um símbolo central entre dois filetes. */
export function Ornament({
  symbol = "✦",
  className = "",
}: {
  symbol?: string;
  className?: string;
}) {
  return (
    <div className={`ornament text-sm ${className}`} aria-hidden>
      {symbol}
    </div>
  );
}
