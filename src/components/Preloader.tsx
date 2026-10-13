import { useEffect, useMemo, useRef, useState } from 'react'
import { content, assetUrl } from '@/lib/content'
import { markIntroDone, rememberPreload } from '@/lib/intro'
import { reducedMotion } from '@/lib/smooth'
import BarNumber from '@/components/BarNumber'

const STRIPS = 8
const MIN_MS = 600 // счётчик не быстрее, иначе это мигание
const MAX_MS = 1100 // потолок ожидания: дальше дожимаем до 100
const HOLD_MS = 100
const STRIP_MS = 520
const STAGGER_MS = 35
const SUNSET_LAG_MS = 90

/** Цвет шторки i на брендовом градиенте: crimson → red → ember (DESIGN.md §2). */
const STOPS: [number, [number, number, number]][] = [
  [0, [0x92, 0x02, 0x28]],
  [0.45, [0xc2, 0x1a, 0x2a]],
  [1, [0xf6, 0x65, 0x26]],
]
function sunset(t: number) {
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i]
    const [t0, c0] = STOPS[i - 1]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`
    }
  }
  return 'rgb(246,101,38)'
}

function preloadImage(src: string) {
  return new Promise<void>((res) => {
    const img = new Image()
    img.onload = img.onerror = () => res()
    img.src = src
    img.decode?.().then(res, res)
  })
}

/**
 * 00 · Preloader. Счётчик 0→100 привязан к реальной загрузке: шрифты + hero + cutout.
 * Цифры собраны из вертикальных баров; на 100 выезжают шторки ink, за ними crimson→ember.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const real = useRef(0)
  const calm = useMemo(() => reducedMotion(), [])
  const mobile = useMemo(() => window.matchMedia('(max-width: 767px)').matches, [])

  // Бары собираются со следующего кадра, а не стоят готовыми
  useEffect(() => {
    const r = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(r)
  }, [])

  // 1. Реальная загрузка
  useEffect(() => {
    const jobs: Promise<unknown>[] = [
      document.fonts.load("900 1em 'Archivo'"),
      document.fonts.load("500 1em 'JetBrains Mono'"),
      preloadImage(assetUrl(mobile ? content.hero.vertical : content.hero.main)),
    ]
    if (!mobile && content.hero.cutout) jobs.push(preloadImage(assetUrl(content.hero.cutout)))
    let done = 0
    jobs.forEach((p) =>
      p.catch(() => undefined).finally(() => {
        done += 1
        real.current = done / jobs.length
      }),
    )
  }, [mobile])

  // 2. Показываемое значение = min(реальный прогресс, время), потолок MAX_MS
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    let finished = false
    const tick = () => {
      const t = performance.now() - t0
      const byTime = calm ? 100 : Math.min(1, t / MIN_MS)
      const target = t >= MAX_MS ? 1 : Math.min(real.current, byTime)
      const shown = Math.round(target * 100)
      setPct(shown)
      if (shown >= 100 && !finished) {
        finished = true
        setTimeout(() => setOpen(true), calm ? 0 : HOLD_MS)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [calm])

  // 3. Шторки: открываем Hero в середине, размонтируем в конце
  useEffect(() => {
    if (!open) return
    const total = calm ? 200 : SUNSET_LAG_MS + STRIP_MS + STRIPS * STAGGER_MS
    const t1 = setTimeout(markIntroDone, calm ? 0 : total * 0.45)
    const t2 = setTimeout(() => {
      rememberPreload()
      onDone()
    }, total + 40)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [open, calm, onDone])

  // Скролл заблокирован, пока идёт вступление
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = prev
    }
  }, [])

  const strips = Array.from({ length: STRIPS }, (_, i) => i)

  return (
    <div
      role="progressbar"
      aria-label={content.ui.loading}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="fixed inset-0 z-[80] overflow-hidden"
      style={{
        pointerEvents: open ? 'none' : 'auto',
        opacity: calm && open ? 0 : 1,
        transition: 'opacity 200ms linear',
      }}
    >
      {/* слой 2: закатные шторки, уходят чуть позже */}
      <div className="absolute inset-0 flex" aria-hidden>
        {strips.map((i) => (
          <span
            key={i}
            className="h-full flex-1"
            style={{
              background: sunset(i / (STRIPS - 1)),
              transform: open && !calm ? 'translateY(-101%)' : 'translateY(0)',
              transition: `transform ${STRIP_MS}ms var(--ease-inout) ${SUNSET_LAG_MS + i * STAGGER_MS}ms`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* слой 1: ink-шторки со счётчиком */}
      <div className="absolute inset-0 flex" aria-hidden>
        {strips.map((i) => (
          <span
            key={i}
            className="h-full flex-1"
            style={{
              background: 'var(--ink)',
              transform: open && !calm ? 'translateY(-101%)' : 'translateY(0)',
              transition: `transform ${STRIP_MS}ms var(--ease-inout) ${i * STAGGER_MS}ms`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* счётчик из баров */}
      <div
        className="absolute inset-0 grid place-items-center text-bone"
        style={{
          opacity: open ? 0 : 1,
          transition: 'opacity var(--dur-xs) linear',
        }}
      >
        <div className="flex flex-col gap-4">
          <BarNumber
            value={String(pct).padStart(3, '0')}
            cell="clamp(10px, 3.2vw, 40px)"
            ms={320}
            stagger={8}
            active={armed}
          />
          <p className="t-micro flex justify-between text-bone-dim">
            <span>{content.ui.loading}</span>
            <span aria-hidden>
              <span className="text-ember">.</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
