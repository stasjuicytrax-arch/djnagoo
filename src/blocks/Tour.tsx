import { useEffect, useMemo, useRef, useState } from 'react'
import { content, assetUrl, type TourItem } from '@/lib/content'
import { getLenis, reducedMotion } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'
import ImageLightbox, { type LightboxItem } from '@/components/ImageLightbox'
import { fmtDate, groupOf } from '@/lib/format'

const { tour, venues, ui } = content
const T = ui.tour

const place = (it: TourItem) => [it.city, it.country].filter(Boolean).join(' · ')

const eventLine = (it: TourItem) => {
  const w = (it as { with?: string[] }).with
  return [it.event, w?.length ? `${T.with} ${w.join(', ')}` : null].filter(Boolean).join(' · ')
}

const caption = (it: TourItem) =>
  [fmtDate(it), it.venue, place(it)].filter(Boolean).join(' / ')

/** Новые даты сверху: букеру важнее свежее. */
const ITEMS = [...tour.items].reverse()

type Group = { name: string; country: string | null; items: TourItem[] }
const GROUPS: Group[] = (() => {
  const m = new Map<string, Group>()
  for (const it of tour.items) {
    const g = groupOf(it)
    if (!m.has(g)) m.set(g, { name: g, country: it.country ?? null, items: [] })
    m.get(g)!.items.push(it)
  }
  return [...m.values()].sort((a, b) => b.items.length - a.items.length)
})()

const YEARS = (() => {
  const ys = tour.items.map((i) => Number((i.date ?? (i as { monthHint?: string }).monthHint ?? '').slice(0, 4))).filter(Boolean)
  return [Math.min(...ys), Math.max(...ys)]
})()

/* ───────── афиша у курсора (list, desktop) ───────── */
function PosterFollower({ src }: { src: string | null }) {
  const el = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0, r: 0 })

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let raf = 0
    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
    }
    const loop = () => {
      const p = pos.current
      const vx = p.x - p.cx
      p.cx += (p.x - p.cx) * 0.16
      p.cy += (p.y - p.cy) * 0.16
      p.r += (Math.max(-6, Math.min(6, vx * 0.35)) - p.r) * 0.2 // наклон по направлению движения
      const W = 220
      const right = p.cx + 28 + W > window.innerWidth - 16
      const x = right ? p.cx - 28 - W : p.cx + 28
      const y = Math.min(Math.max(p.cy - 150, 16), window.innerHeight - 300)
      if (el.current) el.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${p.r.toFixed(2)}deg)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={el}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[55] hidden w-[220px] md:block"
      style={{ opacity: src ? 1 : 0, transition: 'opacity var(--dur-xs) linear' }}
    >
      {src && <img src={src} alt="" className="block w-full rounded-[20px]" />}
    </div>
  )
}

/* ───────── вид A: список ───────── */
function ListView({ onOpen, onHover }: { onOpen: (i: number) => void; onHover: (src: string | null) => void }) {
  return (
    <ul data-avoid-cta className="m-0 list-none p-0">
      {ITEMS.map((it, i) => (
        <li key={it.id} className="tour-row group relative border-t border-[var(--line)] last:border-b">
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 transition-transform duration-[var(--dur-m)] ease-[var(--ease-out)] group-hover:scale-x-100 group-focus-within:scale-x-100"
            style={{ backgroundImage: 'var(--grad-sunset)' }}
          />
          <button
            type="button"
            aria-label={`${T.showPoster}: ${caption(it)}`}
            onClick={() => onOpen(i)}
            onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(assetUrl(it.poster))}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(null)}
            data-cursor="view"
            className="relative grid min-h-[88px] w-full grid-cols-1 items-center gap-x-6 gap-y-1 px-[var(--gutter-x)] py-5 text-left md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,30%)] md:py-6"
          >
            <span className="t-micro tabular-nums text-bone-dim transition-colors group-hover:text-bone">
              {fmtDate(it)}
            </span>
            <span className="t-md-cond leading-[1] text-bone">
              {it.venue}
            </span>
            <span className="t-micro mt-1 flex flex-col gap-1 text-bone-dim transition-colors group-hover:text-ink md:mt-0 md:text-right">
              <span>{place(it)}</span>
              {eventLine(it) && <span className="opacity-90">{eventLine(it)}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ───────── вид B: стеклянные папки по городам ───────── */
function Folder({
  g,
  open,
  index,
  onToggle,
}: {
  g: Group
  open: boolean
  index: number
  onToggle: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [seen, setSeen] = useState(reducedMotion())

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  // наклон к указателю (desktop)
  const lean = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--ry', `${x * 10}deg`)
    ref.current.style.setProperty('--rx', `${-y * 8}deg`)
  }
  const unlean = () => {
    ref.current?.style.setProperty('--ry', '0deg')
    ref.current?.style.setProperty('--rx', '0deg')
  }

  const thumbs = g.items.slice(0, 3)
  const tilt = [-9, 2, 8]

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      onPointerMove={lean}
      onPointerLeave={unlean}
      aria-expanded={open}
      aria-label={`${open ? T.closeFolder : T.openFolder}: ${g.name}, ${g.items.length} ${T.dates}`}
      className={`folder group relative block aspect-[5/4] w-full text-left ${index === 0 ? "xl:col-span-2 xl:aspect-[5/2]" : ""}`}
      style={{
        transform: 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform var(--dur-s) var(--ease-out)',
      }}
      data-seen={seen}
    >
      {/* задняя стенка + ушко */}
      <span
        aria-hidden
        className="absolute left-[6%] top-[4%] h-[16%] w-[36%] rounded-t-[20px]"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--crimson), var(--red))' }}
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 top-[14%] rounded-[20px]"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--crimson), var(--red) 55%, var(--ember))' }}
      />
      {/* файлы выглядывают из папки */}
      {thumbs.map((it, k) => (
        <img
          key={it.id}
          src={assetUrl(it.poster)}
          alt=""
          loading="lazy"
          decoding="async"
          className="folder-file absolute bottom-[36%] aspect-[3/4] w-[34%] object-cover"
          style={{
            left: `${10 + k * 26}%`,
            ['--r' as string]: `${tilt[k]}deg`,
            ['--d' as string]: `${index * 90 + k * 70}ms`,
          }}
        />
      ))}
      {/* стеклянный фронт */}
      <span
        className="absolute inset-x-0 bottom-0 flex h-[58%] flex-col justify-end gap-1 rounded-[20px] border border-bone/20 bg-bone/10 p-5 backdrop-blur-[14px]"
      >
        <span className="t-cond text-balance break-words leading-[0.95]" style={{ fontSize: "clamp(18px, 1.7vw, 28px)" }}>{g.name}</span>
        <span className="t-micro text-bone">
          {g.country ? `${g.country} · ` : ''}
          {g.items.length} {g.items.length === 1 ? T.night : T.nights}
        </span>
      </span>
    </button>
  )
}

function FoldersView({ onOpen }: { onOpen: (items: TourItem[], i: number) => void }) {
  const [openName, setOpenName] = useState<string | null>(null)
  const open = GROUPS.find((g) => g.name === openName) ?? null
  const stage = useRef<HTMLDivElement>(null)

  // на mobile веер оказывается ниже рядов папок: подводим экран к нему
  useEffect(() => {
    if (!open || !stage.current) return
    const el = stage.current
    const t = window.setTimeout(() => {
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.1 })
      else el.scrollIntoView({ behavior: 'auto', block: 'start' })
    }, 80)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <div className="px-[var(--gutter-x)]">
      <div className="grid grid-cols-2 gap-[var(--col-gap)] md:grid-cols-3 xl:grid-cols-6">
        {GROUPS.map((g, i) => (
          <Folder
            key={g.name}
            g={g}
            index={i}
            open={openName === g.name}
            onToggle={() => setOpenName((n) => (n === g.name ? null : g.name))}
          />
        ))}
      </div>

      {open && (
        <div ref={stage} data-avoid-cta className="mt-[var(--space-block)] scroll-mt-24" key={open.name}>
          <p className="t-micro mb-6 text-bone-dim">
            {open.name} · {open.items.length} {T.dates}
          </p>
          <ul className="fan m-0 flex list-none gap-0 overflow-x-auto p-0 pb-8 pl-10 pt-8 [scrollbar-width:none] md:flex-wrap md:gap-x-6 md:gap-y-10 md:overflow-visible md:pl-0">
            {open.items.map((it, i) => {
              const mid = (open.items.length - 1) / 2
              return (
                <li
                  key={it.id}
                  className="fan-item -ml-10 shrink-0 first:ml-0 md:ml-0"
                  style={{ ['--r' as string]: `${(i - mid) * 2.6}deg`, ['--i' as string]: i }}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(open.items, i)}
                    aria-label={`${T.showPoster}: ${caption(it)}`}
                    data-cursor="view"
                    className="block w-[min(52vw,240px)]"
                  >
                    <img
                      src={assetUrl(it.poster)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="block w-full rounded-[20px]"
                    />
                    <span className="t-micro mt-2 block text-bone-dim">{fmtDate(it)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ───────── marquee площадок: скорость зависит от скролла ───────── */
function VenueMarquee() {
  const track = useRef<HTMLDivElement>(null)
  const calm = useMemo(() => reducedMotion(), [])

  useEffect(() => {
    const el = track.current
    if (!el || calm) return
    let x = 0
    let raf = 0
    let lastY = window.scrollY
    let boost = 0
    let vis = true
    const io = new IntersectionObserver(([e]) => (vis = e.isIntersecting))
    io.observe(el)
    const loop = () => {
      if (!vis) {
        raf = requestAnimationFrame(loop)
        return
      }
      const y = window.scrollY
      boost += (Math.min(Math.abs(y - lastY), 60) - boost) * 0.1
      lastY = y
      x -= 0.5 + boost * 0.35
      const half = el.scrollWidth / 2
      if (-x >= half) x += half
      el.style.transform = `translate3d(${x}px,0,0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [calm])

  const row = (key: string) => (
    <ul key={key} className={`m-0 flex list-none items-center gap-6 p-0 pr-6 ${calm ? 'flex-wrap gap-y-2' : 'shrink-0'}`} aria-hidden={key === 'b'}>
      {venues.map((v) => (
        <li key={v} className="t-lg flex shrink-0 items-center gap-6 text-bone-dim">
          {v}
          <span aria-hidden className="inline-block size-3 shrink-0 rounded-full bg-ember" />
        </li>
      ))}
    </ul>
  )

  return (
    <div className={calm ? "px-[var(--gutter-x)]" : "overflow-hidden"} role="group" aria-label="Venues">
      <div ref={track} className={calm ? "" : "flex w-max will-change-transform"}>
        {row('a')}
        {!calm && row('b')}
      </div>
    </div>
  )
}

/**
 * 07 · Tour. Вид A: список 16 дат (новые сверху), hover заливает строку градиентом и показывает афишу
 * у курсора. Вид B: стеклянные папки по 5 городам (концепт 21st glass-folder-cards), клик раскрывает
 * афиши веером. Клик по афише → лайтбокс. Внизу marquee площадок.
 */
export default function Tour() {
  const [view, setView] = useState<'list' | 'cities'>('list')
  const [follow, setFollow] = useState<string | null>(null)
  const [lb, setLb] = useState<{ items: LightboxItem[]; i: number } | null>(null)
  const cities = GROUPS.length

  const openList = (i: number) => setLb({ items: ITEMS.map((it) => ({ src: assetUrl(it.poster), caption: caption(it) })), i })
  const openGroup = (items: TourItem[], i: number) =>
    setLb({ items: items.map((it) => ({ src: assetUrl(it.poster), caption: caption(it) })), i })

  return (
    <section id="tour" className="relative bg-ink text-bone" style={{ paddingBlock: 'var(--space-section)' }}>
      <div className="grid grid-cols-4 items-end gap-x-[var(--col-gap)] gap-y-[var(--space-tight)] px-[var(--gutter-x)] md:grid-cols-8 xl:grid-cols-12">
        <div className="col-span-4 md:col-span-6 xl:col-span-8">
          <SectionTitle lines={ui.titles.tour} />
          <p className="t-micro mt-[var(--space-tight)] tabular-nums text-bone-dim">
            {tour.items.length} {T.nights} · {cities} {T.cities} · {YEARS[0]}–{YEARS[1]}
          </p>
        </div>
        <div
          role="group"
          aria-label={T.views}
          className="col-span-4 flex gap-2 md:col-span-2 md:justify-end xl:col-span-4"
        >
          {(['list', 'cities'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`t-micro min-h-11 rounded-full border px-4 transition-colors ${
                view === v ? 'border-ember bg-ember text-ink' : 'border-bone-faint text-bone hover:border-bone'
              }`}
            >
              {v === 'list' ? T.viewList : T.viewCities}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[var(--space-block)]">
        {view === 'list' ? <ListView onOpen={openList} onHover={setFollow} /> : <FoldersView onOpen={openGroup} />}
      </div>

      <div className="mt-[var(--space-block)]">
        <VenueMarquee />
      </div>

      <PosterFollower src={view === 'list' ? follow : null} />
      <ImageLightbox
        items={lb?.items ?? []}
        index={lb ? lb.i : null}
        onIndex={(i) => setLb((s) => (s ? { ...s, i } : s))}
        onClose={() => setLb(null)}
      />
    </section>
  )
}
