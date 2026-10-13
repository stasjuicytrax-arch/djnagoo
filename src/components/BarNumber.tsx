/**
 * Число, собранное из вертикальных баров (концепт 21st `bar-built-digits`, переписан на DOM).
 * Глиф 5×7; в каждой колонке подряд идущие клетки схлопываются в один бар.
 * Бары скользят и растягиваются между цифрами: transform + opacity, без layout.
 */
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
}

const SLOTS = 3 // макс. число отдельных баров в колонке глифа

type Run = { start: number; len: number }

function runsFor(ch: string, col: number): Run[] {
  const g = GLYPHS[ch]
  const out: Run[] = []
  if (!g) return out
  let start = -1
  for (let r = 0; r <= g.length; r++) {
    const on = r < g.length && g[r][col] === '1'
    if (on && start < 0) start = r
    if (!on && start >= 0) {
      out.push({ start, len: r - start })
      start = -1
    }
  }
  return out
}

type Props = {
  /** Строка из цифр. Число разрядов фиксируйте паддингом снаружи. */
  value: string
  /** Размер клетки, любая CSS-длина. */
  cell?: string
  /** Длительность перехода бара между состояниями, мс. */
  ms?: number
  /** Задержка появления по колонкам, мс (stagger сборки). */
  stagger?: number
  /** false — все бары свёрнуты (до запуска). */
  active?: boolean
  className?: string
  label?: string
}

export default function BarNumber({
  value,
  cell = '24px',
  ms = 420,
  stagger = 18,
  active = true,
  className,
  label,
}: Props) {
  const chars = value.split('')
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{
        display: 'inline-flex',
        gap: `calc(${cell} * 1)`,
        ['--c' as string]: cell,
      }}
    >
      {chars.map((ch, di) => (
        <span key={di} style={{ position: 'relative', display: 'block', width: `calc(var(--c) * 5)`, height: `calc(var(--c) * 7)` }}>
          {[0, 1, 2, 3, 4].map((col) => {
            const runs = runsFor(ch, col)
            return Array.from({ length: SLOTS }, (_, s) => {
              const run = runs[s]
              const on = active && !!run
              const y = run ? run.start : 3
              const h = run ? run.len : 0
              return (
                <span
                  key={`${col}-${s}`}
                  style={{
                    position: 'absolute',
                    left: `calc(var(--c) * ${col})`,
                    top: 0,
                    width: `calc(var(--c) * 0.78)`,
                    height: 'var(--c)',
                    background: 'currentColor',
                    transformOrigin: 'top',
                    transform: `translateY(calc(var(--c) * ${y})) scaleY(${on ? h : 0})`,
                    opacity: on ? 1 : 0,
                    transition: `transform ${ms}ms var(--ease-out) ${(di * 5 + col) * stagger}ms, opacity ${ms / 2}ms linear ${(di * 5 + col) * stagger}ms`,
                    willChange: 'transform',
                  }}
                />
              )
            })
          })}
        </span>
      ))}
    </span>
  )
}
