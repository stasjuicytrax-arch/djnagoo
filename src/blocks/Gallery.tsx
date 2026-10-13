import { useEffect, useMemo, useRef, useState } from 'react'
import { content, assetUrl } from '@/lib/content'
import { reducedMotion } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'
import ImageLightbox, { type LightboxItem } from '@/components/ImageLightbox'
import { fmtDate } from '@/lib/format'

const { press, tour, videos, ui } = content
const G = ui.gallery

type Shot = { src: string; caption: string; kind: 'press' | 'poster' | 'clip' }

/** 6 пресс-фото + 16 афиш + 3 постера видео, перемешаны: афиши как основа, остальное вкраплено. */
function buildShots(): Shot[] {
  const posters: Shot[] = tour.items.map((t) => ({
    src: assetUrl(t.poster),
    caption: [fmtDate(t), t.venue, t.city].filter(Boolean).join(' / '),
    kind: 'poster',
  }))
  const photos: Shot[] = press.map((p, i) => ({ src: assetUrl(p.src), caption: `${G.press} ${i + 1}`, kind: 'press' }))
  const clips: Shot[] = videos.map((v) => ({ src: assetUrl(v.poster), caption: `${G.clip}: ${v.caption}`, kind: 'clip' }))
  const out: Shot[] = []
  let pi = 0
  let ci = 0
  posters.forEach((p, i) => {
    out.push(p)
    if (i % 3 === 1 && pi < photos.length) out.push(photos[pi++])
    if (i % 6 === 4 && ci < clips.length) out.push(clips[ci++])
  })
  while (pi < photos.length) out.push(photos[pi++])
  while (ci < clips.length) out.push(clips[ci++])
  return out
}

const ROWS = [
  { speed: 0.35, shift: 0 },
  { speed: -0.5, shift: 7 },
  { speed: 0.28, shift: 13 },
] as const

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * 08 · Gallery. «Tilted grid hero» (21st недоступен без авторизации, сделано по описанию):
 * изогнутая бесконечная лента из трёх рядов, края загибаются к зрителю и гаснут, центр плоский.
 * Дуотон ink→ember, в центре и по hover проявляется цвет. Клик → лайтбокс-слайдер.
 */
export default function Gallery() {
  const shots = useMemo(buildShots, [])
  const stage = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused
  const hoverRef = useRef(false)
  const calm = useMemo(() => reducedMotion(), [])
  const items: LightboxItem[] = useMemo(() => shots.map((s) => ({ src: s.src, caption: s.caption })), [shots])

  useEffect(() => {
    const root = stage.current
    if (!root) return
    const rows = [...root.querySelectorAll<HTMLElement>('[data-row]')]
    const state = rows.map((row, ri) => ({
      row,
      tiles: [...row.querySelectorAll<HTMLElement>('[data-tile]')],
      x: 0,
      ri,
    }))
    let raf = 0
    let last = performance.now()
    let visible = true
    let scrollY = window.scrollY
    let prevScroll = scrollY
    let boost = 0

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(root)

    const layout = (dt: number) => {
      const W = root.clientWidth
      const narrow = W < 768
      const cx = W / 2
      boost += (Math.min(Math.abs(scrollY - prevScroll), 80) - boost) * 0.08
      prevScroll = scrollY
      for (const r of state) {
        const cfg = ROWS[r.ri]
        const tileW = r.tiles[0].offsetWidth
        const gap = 20
        const pitch = tileW + gap
        const total = pitch * r.tiles.length
        if (!calm && !pausedRef.current && !hoverRef.current) r.x += (cfg.speed * 60 + Math.sign(cfg.speed) * boost * 6) * dt
        r.tiles.forEach((el, i) => {
          let x = i * pitch - r.x + cfg.shift * 20
          x = ((x % total) + total) % total
          if (x > total - pitch * 2) x -= total // оборачиваем слева
          const c = x + tileW / 2
          const t = (c - cx) / cx // −1…1 по ширине кадра
          const a = Math.abs(t)
          const fade = 1 - (narrow ? smooth(0.85, 1.25, a) : smooth(0.55, 1.05, a))
          // края загибаются к зрителю: поворот по Y и вынос по Z
          const rot = -t * 42 * smooth(0.12, 1, a)
          const z = smooth(0.2, 1, a) * 220
          const s = 1 + smooth(0.3, 1.1, a) * 0.12
          el.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${rot}deg) scale(${s})`
          el.style.opacity = String(fade)
          el.style.visibility = fade < 0.02 ? 'hidden' : 'visible'
          el.dataset.center = a < 0.16 && r.ri !== 1 ? '1' : '0'
        })
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (visible) layout(dt)
      raf = requestAnimationFrame(loop)
    }
    const onScroll = () => (scrollY = window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    layout(0)
    raf = requestAnimationFrame(loop)
    const onResize = () => layout(0)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [calm, shots])

  const rowShots = (ri: number) => {
    // у каждого ряда свой сдвиг в общей ленте, чтобы кадры не совпадали по вертикали
    const n = shots.length
    return Array.from({ length: Math.min(n, 16) }, (_, i) => (i * 2 + ROWS[ri].shift) % n)
  }

  return (
    <section
      id="gallery"
      className="relative overflow-hidden bg-ink text-bone"
      style={{ paddingBlock: 'clamp(64px, 8vw, 128px)' }}
    >
      <div
        ref={stage}
        className="relative mx-auto h-[min(82svh,860px)] w-full [perspective:1400px] max-md:h-[78svh]"
        onPointerEnter={(e) => (hoverRef.current = e.pointerType === 'mouse')}
        onPointerLeave={() => (hoverRef.current = false)}
      >
        <div
          className="absolute inset-0 flex flex-col justify-center gap-5 [transform-style:preserve-3d]"
          style={{ transform: 'rotateZ(-5deg) scale(1.08)' }}
        >
          {ROWS.map((_, ri) => (
            <div
              key={ri}
              data-row
              aria-hidden={ri > 0 ? true : undefined}
              className="relative h-[26%] w-full [transform-style:preserve-3d]"
            >
              {rowShots(ri).map((si) => {
                const s = shots[si]
                return (
                  <button
                    key={si}
                    data-tile
                    type="button"
                    tabIndex={ri > 0 ? -1 : 0}
                    data-cursor="view"
                    aria-label={`${G.open}: ${s.caption}`}
                    onClick={() => setOpen(si)}
                    className="gallery-tile absolute left-0 top-0 aspect-[4/5] h-full overflow-hidden rounded-[20px] bg-ember will-change-transform"
                  >
                    <img
                      src={s.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="size-full object-cover"
                    />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* заголовок поверх, по центру; ink-подложка держит читаемость над кадрами */}
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(52% 44% at 50% 50%, rgba(11,9,8,.92), rgba(11,9,8,.55) 55%, transparent 80%)' }}
          />
          <div className="relative text-center">
            <SectionTitle lines={ui.titles.gallery} className="text-center" />
            <p className="t-micro mt-[var(--space-tight)] text-bone">
              {press.length} {G.photos} · {tour.items.length} {G.posters} · {videos.length} {G.clips}
            </p>
          </div>
        </div>
      </div>

      {!calm && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="t-micro link-draw absolute bottom-6 left-[var(--gutter-x)] z-20 py-3 text-bone-dim hover:text-bone"
        >
          {paused ? ui.motion.play : ui.motion.pause}
        </button>
      )}
      <ImageLightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </section>
  )
}
