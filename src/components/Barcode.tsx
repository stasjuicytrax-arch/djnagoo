/** Декор-штрихкод из строки (SEKO): биты кодов символов → бары двух ширин, вертикально. */
export default function Barcode({ text, className }: { text: string; className?: string }) {
  const bars: { y: number; h: number }[] = []
  let y = 0
  let on = true
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    for (let b = 7; b >= 0; b--) {
      const h = (code >> b) & 1 ? 3 : 1.5
      if (on) bars.push({ y, h })
      y += h
      on = !on
    }
    y += 2
    on = true
  }
  return (
    <svg
      viewBox={`0 0 14 ${y}`}
      preserveAspectRatio="none"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      {bars.map((b, i) => (
        <rect key={i} x="0" y={b.y} width="14" height={b.h} />
      ))}
    </svg>
  )
}
