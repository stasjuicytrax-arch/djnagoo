/**
 * Число-«барабан» (одометр) в голосе заголовков: Archivo wdth 62 / wght 800.
 * Разряды — вертикальные ленты 0–9; старший сдвигается, только когда младший проходит 9→0.
 * Старший разряд «100» появляется, когда значение достигает 100.
 */
const CELLS = Array.from({ length: 20 }, (_, i) => i % 10)

function Column({ pos, collapsed }: { pos: number; collapsed?: boolean }) {
  return (
    <span
      className="block h-[1em] overflow-hidden leading-[1em]"
      style={{
        width: collapsed ? 0 : '0.4em',
        opacity: collapsed ? 0 : 1,
        transition: 'width 180ms var(--ease-out), opacity 120ms linear',
      }}
    >
      <span
        className="block"
        style={{
          transform: `translate3d(0, ${-pos}em, 0)`,
          transition: 'transform 220ms var(--ease-out)',
          willChange: 'transform',
        }}
      >
        {CELLS.map((d, i) => (
          <span key={i} className="block h-[1em] leading-[1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

export default function DrumNumber({ value, className = '' }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const units = v % 10
  const tens = Math.floor(v / 10) % 10
  const hund = Math.floor(v / 100)
  return (
    <span
      role="img"
      aria-label={String(Math.round(v))}
      className={`stat-num inline-flex leading-[1em] ${className}`}
    >
      <Column pos={hund} collapsed={hund === 0} />
      <Column pos={tens} />
      <Column pos={units} />
    </span>
  )
}
