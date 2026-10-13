import { useEffect, useMemo, useRef, useState } from 'react'
import { content, assetUrl } from '@/lib/content'
import { reducedMotion } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'

const { genres, ui, press } = content
const photo = press.find((p) => p.src.includes('press-04'))!

/**
 * Три орбиты, периоды 30/40/50s (полиритм 3:4:5), разные направления.
 * d — диаметр кольца в долях сцены. Жанры раскладываются по длине: длинные наружу (3/3/2).
 */
const ORBITS = [
  { d: 0.94, period: 50, dir: 1, take: 3 },
  { d: 0.72, period: 40, dir: -1, take: 3 },
  { d: 0.5, period: 30, dir: 1, take: 2 },
] as const

type Orbit = (typeof ORBITS)[number] & { items: { name: string; angle: number }[] }

function useOrbits(): Orbit[] {
  return useMemo(() => {
    const sorted = [...genres].sort((a, b) => b.length - a.length)
    let k = 0
    return ORBITS.map((o, oi) => {
      const names = sorted.slice(k, k + o.take)
      k += o.take
      const offset = oi * 37 // разводим стартовые углы колец
      return { ...o, items: names.map((name, i) => ({ name, angle: offset + (360 / names.length) * i })) }
    })
  }, [])
}

/**
 * 04 · Sound. Жанры-пилюли вращаются по орбитам вокруг дуотон-фото (концепт 21st polyrhythm-orbit-list
 * на DOM). Текст пилюль горизонтален: внутренний слой крутится в обратную сторону с тем же периодом.
 * Hover: орбита замедляется до 12%, пилюля заливается ember. Mobile: вся сцена в масштабе 0.6.
 * Движение можно остановить (WCAG 2.2.2) и оно стоит вне экрана.
 */
export default function Sound() {
  const orbits = useOrbits()
  const scene = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused
  const api = useRef<{ setPaused: (p: boolean) => void } | null>(null)

  useEffect(() => {
    const root = scene.current
    if (!root || reducedMotion()) return
    const groups: { anims: Animation[]; rate: number; target: number }[] = []
    root.querySelectorAll<HTMLElement>('[data-orbit]').forEach((el, i) => {
      const o = ORBITS[i]
      const opts: KeyframeAnimationOptions = { duration: o.period * 1000, iterations: Infinity, easing: 'linear' }
      const anims = [
        el.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${o.dir * 360}deg)` }], opts),
        ...[...el.querySelectorAll<HTMLElement>('[data-counter]')].map((c) =>
          c.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${-o.dir * 360}deg)` }], opts),
        ),
      ]
      groups.push({ anims, rate: 1, target: 1 })
    })

    let raf = 0
    const tick = () => {
      let moving = false
      for (const g of groups) {
        if (Math.abs(g.target - g.rate) > 0.002) {
          g.rate += (g.target - g.rate) * 0.1
          g.anims.forEach((a) => a.updatePlaybackRate(g.rate))
          moving = true
        }
      }
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const over = (e: Event, rate: number) => {
      const t = e.target as HTMLElement
      if (!t.closest('.genre-pill')) return
      const orbit = t.closest('[data-orbit]') as HTMLElement | null
      if (!orbit) return
      const g = groups[Number(orbit.dataset.orbit)]
      if (g) {
        g.target = rate
        kick()
      }
    }
    const enter = (e: Event) => over(e, 0.12)
    const leave = (e: Event) => over(e, 1)
    root.addEventListener('pointerover', enter)
    root.addEventListener('pointerout', leave)

    const setP = (p: boolean) => groups.forEach((g) => g.anims.forEach((a) => (p ? a.pause() : a.play())))
    api.current = { setPaused: setP }
    // вне экрана — на паузе
    const io = new IntersectionObserver(([e]) => setP(!e.isIntersecting || pausedRef.current), { threshold: 0.05 })
    io.observe(root)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      root.removeEventListener('pointerover', enter)
      root.removeEventListener('pointerout', leave)
      groups.forEach((g) => g.anims.forEach((a) => a.cancel()))
      api.current = null
    }
  }, [])

  useEffect(() => {
    api.current?.setPaused(paused)
  }, [paused])

  return (
    <section
      id="sound"
      className="relative overflow-hidden bg-ink text-bone"
      style={{ paddingBlock: 'var(--space-section)' }}
    >
      <div className="grid grid-cols-4 items-center gap-x-[var(--col-gap)] gap-y-[var(--space-block)] px-[var(--gutter-x)] md:min-h-[70svh] md:grid-cols-8 xl:grid-cols-12">
        <div className="col-span-4 md:col-span-3 xl:col-span-4 xl:self-start">
          <SectionTitle lines={ui.titles.sound} />
          <p className="t-micro mt-[var(--space-tight)] text-bone-dim">
            {genres.length} {ui.genresCaption}
          </p>
          {!reducedMotion() && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="t-micro link-draw relative mt-6 inline-flex min-h-11 items-center text-bone-dim hover:text-bone"
            >
              {paused ? ui.motion.play : ui.motion.pause}
            </button>
          )}
        </div>

        <div className="col-span-4 md:col-span-5 xl:col-span-8">
          {/* mobile: сцена проектируется в 1.67× и сжимается до 0.6 */}
          <div className="relative mx-auto aspect-square w-[min(100%,78svh,820px)]" aria-hidden>
            <div
              ref={scene}
              className="absolute left-0 top-0 aspect-square w-full [container-type:size] max-md:w-[166.7%] max-md:origin-top-left max-md:scale-[0.6]"
            >
              {orbits.map((o, oi) => (
                <div
                  key={oi}
                  data-orbit={oi}
                  className="absolute left-1/2 top-1/2 rounded-full border border-bone/20"
                  style={{
                    width: `${o.d * 100}cqw`,
                    height: `${o.d * 100}cqw`,
                    marginLeft: `${(-o.d * 100) / 2}cqw`,
                    marginTop: `${(-o.d * 100) / 2}cqw`,
                  }}
                >
                  {o.items.map((it) => (
                    <span
                      key={it.name}
                      className="absolute left-1/2 top-1/2 block"
                      style={{
                        transform: `rotate(${it.angle}deg) translateX(${(o.d * 100) / 2}cqw) rotate(${-it.angle}deg)`,
                      }}
                    >
                      {/* WAAPI владеет transform у data-counter; центрирование ниже идёт через свойство translate */}
                      <span data-counter className="block">
                        <span className="genre-pill t-micro block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-bone-faint bg-ink px-3 py-1.5 text-bone">
                          {it.name}
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
              ))}

              {/* центр: артист в дуотоне ink → ember */}
              <div
                className="absolute left-1/2 top-1/2 overflow-hidden rounded-full bg-ember"
                style={{ width: '30cqw', height: '30cqw', transform: 'translate(-50%, -50%)' }}
              >
                <img
                  src={assetUrl(photo.src)}
                  alt=""
                  decoding="async"
                  className="size-full object-cover grayscale contrast-125 mix-blend-multiply"
                />
              </div>
            </div>
          </div>

          {/* дубль списком: доступность и mobile */}
          <ul
            className="mt-[var(--space-block)] flex list-none flex-wrap gap-2 p-0 pb-24 md:sr-only md:pb-0"
            aria-label={ui.genresLabel}
          >
            {genres.map((g) => (
              <li key={g} className="t-micro rounded-full border border-bone-faint px-3 py-1.5">
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
