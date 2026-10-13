import { useEffect, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { reducedMotion } from '@/lib/smooth'
import BarNumber from '@/components/BarNumber'

const { stats } = content
const STAGGER_MS = 120

type Stat = (typeof stats)[number]

/** Значение для показа: стаж считаем от текущего года, остальное как в content.json. */
function shown(s: Stat): number {
  return s.format === 'yearsSince' ? new Date().getFullYear() - s.value : s.value
}

/**
 * 03 · Stats: секция-удар, полоса --grad-sunset на 100vw.
 * Цифры собираются из баров (тот же BarNumber, что в прелоадере), stagger 120ms, один раз,
 * у каждой цифры свой триггер входа: на mobile собирается то, что видно.
 * Первая цифра (стаж) доминирует: в 2 колонки и крупнее.
 * Цвет: bone на тёмной половине градиента, ink на горячей (см. .stat в index.css).
 * Подписи — ink-пилюли: на середине градиента ни bone, ни ink не дают 4.5:1 для 11px.
 */
export default function Stats() {
  const list = useRef<HTMLUListElement>(null)
  const [on, setOn] = useState<boolean[]>(() => stats.map(() => reducedMotion()))

  useEffect(() => {
    const ul = list.current
    if (!ul || reducedMotion()) return
    const timers: number[] = []
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting)
        seen.forEach((e, k) => {
          const i = Number((e.target as HTMLElement).dataset.i)
          io.unobserve(e.target)
          timers.push(window.setTimeout(() => setOn((p) => p.map((v, j) => (j === i ? true : v))), k * STAGGER_MS))
        })
      },
      { threshold: 0.6 },
    )
    ul.querySelectorAll('li').forEach((li) => io.observe(li))
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <section
      id="stats"
      data-avoid-cta
      aria-label="Numbers"
      className="relative flex min-h-[70svh] w-full items-center bg-ink"
      style={{ backgroundImage: 'var(--grad-sunset)', paddingBlock: 'clamp(96px, 12vw, 176px)' }}
    >
      <ul
        ref={list}
        className="m-0 grid w-full list-none grid-cols-2 gap-x-[var(--col-gap)] gap-y-[var(--space-block)] p-0 px-[var(--gutter-x)] md:grid-cols-6 xl:grid-cols-6"
      >
        {stats.map((s, i) => {
          const n = shown(s)
          const lead = i === 0
          return (
            <li
              key={s.label}
              data-i={i}
              className={`stat flex flex-col items-start gap-4 border-t border-current/55 pt-4 md:col-span-2 ${
                lead ? 'col-span-2 xl:col-span-2' : 'xl:col-span-1'
              }`}
            >
              <BarNumber
                value={String(n)}
                label={String(n)}
                active={on[i]}
                cell={lead ? 'clamp(14px, 6vw, 40px)' : 'clamp(9px, 3.4vw, 18px)'}
                ms={520}
                stagger={14}
              />
              <p className="t-micro m-0 flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-bone">
                <span aria-hidden className="inline-block size-2 shrink-0 bg-ember" />
                {s.label}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
