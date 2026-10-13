import { useEffect, useMemo, useRef } from 'react'
import { content } from '@/lib/content'
import { reducedMotion } from '@/lib/smooth'
import { statValue } from '@/lib/stats'

const { stats } = content
const valueOf = statValue

const CELLS = Array.from({ length: 20 }, (_, i) => i % 10)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const ROLL_MS = 1000
const STAGGER_MS = 120

/**
 * 03 · Stats. Обычная секция (~65svh), все четыре цифры на одном экране.
 * При входе в кадр один раз: разряды докручиваются барабаном ~1 с со сдвигом 120ms.
 * Фон --grad-sunset. reduced-motion: сразу финальные значения.
 */
export default function Stats() {
  const root = useRef<HTMLElement>(null)
  const cols = useRef<(HTMLElement | null)[][]>([])
  const numbers = useMemo(() => stats.map(valueOf), [])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const paint = (i: number, v: number) => {
      const list = cols.current[i] ?? []
      const n = list.length
      list.forEach((strip, k) => {
        if (!strip) return
        const power = n - 1 - k
        // одометр: старший разряд сдвигается, только когда младший проходит 9 → 0
        const pos =
          power === 0
            ? v % 10
            : (Math.floor(v / Math.pow(10, power)) +
                Math.min(1, Math.max(0, ((v / Math.pow(10, power - 1)) % 10) - 9))) %
              10
        strip.style.transform = `translate3d(0, ${-pos}em, 0)`
      })
    }

    if (reducedMotion()) {
      numbers.forEach((n, i) => paint(i, n))
      return
    }
    numbers.forEach((_, i) => paint(i, 0))
    const rafs = new Set<number>()
    const timers: number[] = []
    const run = () => {
      numbers.forEach((target, i) => {
        timers.push(
          window.setTimeout(() => {
            const t0 = performance.now()
            const tick = (now: number) => {
              const t = Math.min(1, (now - t0) / ROLL_MS)
              paint(i, target * easeOut(t))
              if (t < 1) rafs.add(requestAnimationFrame(tick))
            }
            rafs.add(requestAnimationFrame(tick))
          }, i * STAGGER_MS),
        )
      })
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        run()
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
      rafs.forEach(cancelAnimationFrame)
    }
  }, [numbers])

  return (
    <section
      id="stats"
      ref={root}
      data-avoid-cta
      aria-label="Numbers"
      className="stats-bg relative flex min-h-[60svh] items-center text-bone md:min-h-[65svh]"
      style={{ paddingBlock: 'clamp(72px, 9vw, 128px)' }}
    >
      <ul className="m-0 grid w-full list-none grid-cols-2 gap-x-[var(--col-gap)] gap-y-[clamp(40px,6vw,72px)] p-0 px-[var(--gutter-x)] md:grid-cols-4">
        {stats.map((s, i) => {
          const digits = String(numbers[i]).length
          return (
            <li key={s.label} className="border-t border-bone/45 pt-5">
              <span className="sr-only">
                {numbers[i]} {s.label}
              </span>
              <span
                aria-hidden
                className="stat-num flex"
                style={{ fontSize: 'clamp(56px, 7vw, 120px)', lineHeight: 1 }}
              >
                {Array.from({ length: digits }, (_, k) => (
                  <span key={k} className="block h-[1em] w-[0.4em] overflow-hidden leading-[1em]">
                    <span
                      ref={(node) => {
                        ;(cols.current[i] ||= [])[k] = node
                      }}
                      className="block"
                      style={{ willChange: 'transform' }}
                    >
                      {CELLS.map((d, j) => (
                        <span key={j} className="block h-[1em] leading-[1em]">
                          {d}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </span>
              <span aria-hidden className="t-micro mt-3 block">
                {s.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
