/** Глобальное зерно: SVG-noise, 7% opacity, overlay (DESIGN.md §6). Склеивает фото разного качества. */
const noise =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export default function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{ backgroundImage: noise, opacity: 0.07, mixBlendMode: 'overlay' }}
    />
  )
}
