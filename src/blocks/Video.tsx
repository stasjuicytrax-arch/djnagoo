import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { content, assetUrl } from '@/lib/content'
import { getLenis, gsap, reducedMotion } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'
import { noiseUrl } from '@/components/Grain'

const { videos, ui } = content
const T = ui.video

type V = (typeof videos)[number]
const byId = (id: string) => videos.find((v) => v.id === id)!

/** Порядок по ТЗ: v03 (ч/б атмосфера) · v01 (главный, крупный) · v02 (толпа, ≤360px, под зерном). */
const ORDER: { v: V; main?: boolean; grain?: boolean; from: number; tilt: number; lift: string }[] = [
  { v: byId('v03'), from: 7, tilt: -3, lift: 'md:mb-[4vw]' },
  { v: byId('v01'), main: true, from: 11, tilt: 0, lift: '' },
  { v: byId('v02'), grain: true, from: 17, tilt: 3, lift: 'md:mb-[4vw]' },
]

const Icon = {
  pause: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="currentColor">
      <rect x="2" y="1" width="3.5" height="12" />
      <rect x="8.5" y="1" width="3.5" height="12" />
    </svg>
  ),
  play: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="currentColor">
      <path d="M2.5 1v12L12.5 7z" />
    </svg>
  ),
  sound: (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 5h3l4-3.5v11L4 9H1z" fill="currentColor" stroke="none" />
      <path d="M10.5 4.5a3.5 3.5 0 0 1 0 5M12.5 2.5a6.5 6.5 0 0 1 0 9" />
    </svg>
  ),
  mute: (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 5h3l4-3.5v11L4 9H1z" fill="currentColor" stroke="none" />
      <path d="M11 5l4 4M15 5l-4 4" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 1l12 12M13 1L1 13" />
    </svg>
  ),
}

/** Круглая 44px кнопка поверх ролика. */
function RoundBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const { label, children, className = '', ...rest } = props
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`pointer-events-auto grid size-11 place-items-center rounded-full bg-ink/60 text-bone backdrop-blur-[14px] transition-colors hover:bg-ember hover:text-ink ${className}`}
    >
      {children}
    </button>
  )
}

function Tile({
  item,
  active,
  onActivate,
  onOpen,
}: {
  item: (typeof ORDER)[number]
  active: boolean
  onActivate: () => void
  onOpen: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(() => reducedMotion())
  const [soundHint, setSoundHint] = useState(false)
  const intent = useRef(0)
  const v = item.v

  // автоплей только видимого; невидимые не качаются (preload none → metadata рядом с экраном)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && el.preload !== 'metadata') el.preload = 'metadata'
      },
      { rootMargin: '100% 0px' },
    )
    const vis = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !paused && !reducedMotion()) void el.play().catch(() => undefined)
        else el.pause()
      },
      { threshold: 0.4 },
    )
    near.observe(el)
    vis.observe(el)
    return () => {
      near.disconnect()
      vis.disconnect()
    }
  }, [paused])

  // звук есть только у активного ролика; остальные глохнут
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!active) {
      el.muted = true
      return
    }
    const can = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive
    if (can === false) {
      setSoundHint(true)
      return
    }
    setSoundHint(false)
    el.muted = false
    // браузер мог поставить на паузу из-за автоплей-политики
    window.setTimeout(() => {
      if (el.paused && !paused) {
        el.muted = true
        void el.play().catch(() => undefined)
        setSoundHint(true)
      }
    }, 150)
  }, [active, paused])

  const togglePause = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) {
      setPaused(false)
      void el.play().catch(() => undefined)
    } else {
      setPaused(true)
      el.pause()
    }
  }

  const w = item.main ? 'w-[34vw] max-w-[560px]' : 'w-[22vw] max-w-[360px]'

  return (
    <figure
      data-tile
      data-from={item.from}
      data-tilt={item.tilt}
      className={`relative m-0 shrink-0 snap-center max-md:w-[78vw] max-md:max-w-none ${item.main ? 'max-md:order-first' : ''} ${item.lift} ${w}`}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        intent.current = window.setTimeout(onActivate, 250)
      }}
      onPointerLeave={() => window.clearTimeout(intent.current)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] bg-ink-2">
        <video
          ref={ref}
          src={assetUrl(v.src)}
          poster={assetUrl(v.poster)}
          muted
          loop
          playsInline
          preload="none"
          aria-label={v.caption}
          className={`size-full object-cover ${v.id === 'v03' ? 'grayscale' : ''}`}
        />
        {item.grain && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
            style={{ backgroundImage: noiseUrl }}
          />
        )}
        {/* вся поверхность — открыть в лайтбоксе */}
        <button
          type="button"
          data-cursor="play"
          aria-label={`${T.open}: ${v.caption}`}
          onClick={onOpen}
          className="absolute inset-0 focus-visible:outline-offset-[-3px]"
        />
        {soundHint && (
          <span className="t-micro pointer-events-none absolute left-3 top-3 rounded-full bg-ink/60 px-3 py-1.5 backdrop-blur-[14px]">
            {T.tapForSound}
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
          <RoundBtn label={paused ? T.play : T.pause} onClick={togglePause}>
            {paused ? Icon.play : Icon.pause}
          </RoundBtn>
          <RoundBtn label={active ? T.soundOff : T.soundOn} onClick={onActivate}>
            {active ? Icon.sound : Icon.mute}
          </RoundBtn>
        </div>
      </div>
    </figure>
  )
}

function Lightbox({ v, onClose }: { v: V | null; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null)
  const vid = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (v && !d.open) {
      d.showModal()
      void vid.current?.play().catch(() => undefined)
    }
    if (!v && d.open) d.close()
    if (v) getLenis()?.stop()
    return () => getLenis()?.start()
  }, [v])

  return (
    <dialog
      ref={dlg}
      onClose={onClose}
      onClick={(e) => e.target === dlg.current && onClose()}
      aria-label={v?.caption ?? 'Video'}
      className="m-auto h-svh max-h-none w-screen max-w-none bg-ink/95 p-0 text-bone backdrop:bg-ink"
    >
      {v && (
        <div
          className="grid h-full w-full place-items-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <video
            ref={vid}
            key={v.id}
            src={assetUrl(v.src)}
            poster={assetUrl(v.poster)}
            controls
            autoPlay
            playsInline
            className="max-h-[88svh] max-w-full rounded-[20px]"
          />
          <RoundBtn label={T.close} onClick={onClose} className="absolute right-4 top-4">
            {Icon.close}
          </RoundBtn>
        </div>
      )}
    </dialog>
  )
}

/**
 * 04 · Video. Три вертикальных экрана без рамок: v03 · v01 (главный) · v02 (≤360px, под зерном).
 * Автоплей muted loop у видимых; hover/кнопка → звук только у активного; клик → лайтбокс.
 * Scroll: parallax 0.9/1/1.1 и поворот ±3° → 0 (scrub).
 */
export default function Video() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [open, setOpen] = useState<V | null>(null)
  const close = useCallback(() => setOpen(null), [])

  useLayoutEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    const tiles = el.querySelectorAll<HTMLElement>('[data-tile]')
    const ctx = gsap.context(() => {
      const mobile = window.matchMedia('(max-width: 767px)').matches
      tiles.forEach((t) => {
        gsap.fromTo(
          t,
          { yPercent: mobile ? 0 : Number(t.dataset.from), rotate: Number(t.dataset.tilt) },
          {
            yPercent: 0,
            rotate: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'center 55%', scrub: true },
          },
        )
      })
    }, el)
    return () => {
      ctx.revert()
      gsap.set(tiles, { clearProps: 'transform' })
    }
  }, [])

  return (
    <section
      id="video"
      ref={root}
      className="relative overflow-hidden bg-ink text-bone"
      style={{ paddingBlock: 'clamp(96px, 11vw, 168px) clamp(80px, 10vw, 160px)' }}
    >
      <div className="px-[var(--gutter-x)]">
        <SectionTitle lines={ui.titles.video} className="text-center" />
      </div>

      <div
        className="mt-[var(--space-block)] flex snap-x snap-mandatory items-end gap-[var(--col-gap)] overflow-x-auto px-[var(--gutter-x)] [scrollbar-width:none] md:snap-none md:justify-center md:overflow-visible"
        onPointerLeave={() => setActive(null)}
      >
        {ORDER.map((it) => (
          <Tile
            key={it.v.id}
            item={it}
            active={active === it.v.id}
            onActivate={() => setActive((a) => (a === it.v.id ? null : it.v.id))}
            onOpen={() => {
              setActive(null)
              setOpen(it.v)
            }}
          />
        ))}
      </div>

      <Lightbox v={open} onClose={close} />
    </section>
  )
}
