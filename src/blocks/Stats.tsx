import { useLayoutEffect, useMemo, useRef } from 'react'
import { content } from '@/lib/content'
import { ScrollTrigger, reducedMotion } from '@/lib/smooth'

const { stats } = content
type Stat = (typeof stats)[number]

/** Значение для показа: стаж считаем от текущего года, остальное как в content.json. */
const valueOf = (s: Stat) => (s.format === 'yearsSince' ? new Date().getFullYear() - s.value : s.value)

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const pad2 = (n: number) => String(n).padStart(2, '0')

/** Колонка «барабана»: две ленты 0–9, смещение = дробная позиция разряда. */
function Drum({ digit }: { digit: number }) {
  const cells = Array.from({ length: 20 }, (_, i) => i % 10)
  return (
    <span className="stat-col relative block h-[1em] overflow-hidden" data-digit={digit}>
      <span className="stat-strip block will-change-transform">
        {cells.map((d, i) => (
          <span key={i} className="block h-[1em] leading-[1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * 03 · Stats. Sticky-экран: цифры по одной, на весь кадр, по скроллу (scrub).
 * Разряды прокручиваются как барабан (одометр) до значения; текущая сжимается по ширине и
 * уезжает вверх, следующая выкатывается снизу. Фон: crimson → ember, смещается по ходу.
 * Тёмный оттенок ember (смесь с ink): bone-текст держит ≥4.5:1 на всём пути.
 */
export default function Stats() {
  const outer = useRef<HTMLElement>(null)
  const items = useRef<(HTMLDivElement | null)[]>([])
  const bg = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const calm = useMemo(() => reducedMotion(), [])
  const S = stats.length
  const numbers = useMemo(() => stats.map(valueOf), [])

  useLayoutEffect(() => {
    if (calm) return
    const root = outer.current
    if (!root) return

    // размер цифры: высота капители ≈ 50svh, но не шире экрана (цифра на всю ширину на mobile)
    const sizeFor = (digits: number) => {
      const w = window.innerWidth - 32
      const byHeight = window.innerHeight * 0.78
      const byWidth = w / (digits * 0.4)
      return Math.min(byHeight, byWidth)
    }

    let enter0 = 0
    let main = 0
    const render = () => {
      const u = main * S
      let shown = 0
      for (let i = 0; i < S; i++) {
        const el = items.current[i]
        if (!el) continue
        const local = u - i
        // следующая цифра начинает выкатываться, пока предыдущая ещё уходит (перекрытие 0.28)
        const e = i === 0 ? clamp(enter0 * 0.55 + clamp(local / 0.45) * 0.45) : clamp((local + 0.28) / 0.5)
        const x = i < S - 1 ? clamp((local - 0.72) / 0.28) : 0
        const roll = easeOut(e)
        const inY = (1 - easeOut(e)) * 70
        const outY = -easeOut(x) * 70
        const sx = 1 - 0.45 * easeOut(x)
        const o = clamp(e * 1.6) * (1 - clamp(x * 1.2))
        el.style.opacity = String(o)
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        el.style.transform = `translate3d(0, ${inY + outY}svh, 0) scaleX(${sx})`
        const v = numbers[i] * roll
        el.querySelectorAll<HTMLElement>('.stat-col').forEach((col, k, all) => {
          const power = all.length - 1 - k // разряд: 10^power
          // одометр: старший разряд сдвигается целиком, только когда младший проходит 9→0
          const pos =
            power === 0
              ? v % 10
              : (Math.floor(v / Math.pow(10, power)) + clamp((v / Math.pow(10, power - 1)) % 10 - 9)) % 10
          ;(col.firstElementChild as HTMLElement).style.transform = `translate3d(0, ${-pos}em, 0)`
        })
        if (e > 0.25 && x < 0.5) shown = i
      }
      if (counter.current) counter.current.textContent = `${pad2(shown + 1)} / ${pad2(S)}`
      if (bg.current) bg.current.style.backgroundPosition = `${clamp((enter0 * 0.1 + main * 0.9)) * 100}% 50%`
    }

    const layout = () => {
      items.current.forEach((el, i) => {
        if (el) {
          const px = sizeFor(String(numbers[i]).length)
          el.style.fontSize = `${px}px`
          el.style.setProperty('--n', `${px}px`)
        }
      })
      render()
    }
    layout()

    const a = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      onUpdate: (self) => {
        enter0 = self.progress
        render()
      },
    })
    const b = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        main = self.progress
        render()
      },
    })
    window.addEventListener('resize', layout)
    return () => {
      a.kill()
      b.kill()
      window.removeEventListener('resize', layout)
    }
  }, [calm, S, numbers])

  // reduced-motion: четыре цифры статичным списком
  if (calm) {
    return (
      <section
        id="stats"
        data-avoid-cta
        aria-label="Numbers"
        className="stats-bg relative text-bone"
        style={{ paddingBlock: 'clamp(80px, 12vw, 160px)' }}
      >
        <ul className="m-0 grid list-none grid-cols-2 gap-x-[var(--col-gap)] gap-y-12 p-0 px-[var(--gutter-x)] md:grid-cols-4">
          {stats.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-2 border-t border-bone/50 pt-4">
              <span className="stat-num text-[clamp(72px,12vw,200px)] leading-[0.9]">{numbers[i]}</span>
              <span className="t-micro">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section
      id="stats"
      ref={outer}
      data-avoid-cta
      aria-label="Numbers"
      className="relative text-bone"
      style={{ height: `${S * 100 + 60}svh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div ref={bg} aria-hidden className="stats-bg absolute inset-0" />

        {/* доступный текст: значения читаются скринридером без анимации */}
        <ul className="sr-only">
          {stats.map((s, i) => (
            <li key={s.label}>
              {numbers[i]} {s.label}
            </li>
          ))}
        </ul>

        {stats.map((s, i) => {
          const digits = String(numbers[i]).split('').map(Number)
          return (
            <div
              key={s.label}
              ref={(el) => {
                items.current[i] = el
              }}
              aria-hidden
              className="absolute inset-0 flex origin-left items-center px-[16px] md:pl-[calc(var(--gutter-x)+12vw)] md:pr-[var(--gutter-x)]"
              style={{ opacity: 0, visibility: 'hidden' }}
            >
              <div className="flex flex-col md:flex-row md:items-end md:gap-6">
                <span className="stat-num flex leading-[1em]">
                  {digits.map((d, k) => (
                    <Drum key={k} digit={d} />
                  ))}
                </span>
                <span className="t-micro mt-2 text-[11px] md:mb-[calc(var(--n)*0.14)] md:mt-0" style={{ fontSize: 'var(--t-micro)' }}>
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}

        <span ref={counter} aria-hidden className="t-micro absolute left-[var(--gutter-x)] top-24 tabular-nums">
          01 / {pad2(S)}
        </span>
      </div>
    </section>
  )
}
