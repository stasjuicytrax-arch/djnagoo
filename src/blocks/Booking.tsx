import { useCallback, useEffect, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { scrollToId } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'
import HazeCanvas from '@/components/HazeCanvas'

const { contacts, ui, artist } = content
const B = ui.booking

/** Магнитное притяжение к курсору (desktop), ±amp px. */
function useMagnet<T extends HTMLElement>(amp = 12) {
  const ref = useRef<T>(null)
  const onPointerMove = (e: React.PointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    ref.current.style.translate = `${dx * amp}px ${dy * amp}px`
  }
  const onPointerLeave = () => {
    if (ref.current) ref.current.style.translate = '0 0'
  }
  return { ref, onPointerMove, onPointerLeave }
}

const CopyIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="4.5" y="4.5" width="8" height="8" />
    <path d="M9.5 4.5v-3h-8v8h3" />
  </svg>
)

/**
 * 09 · Booking + Footer. Фон: дымка WebGL (velvet-haze в палитре crimson/ember).
 * Контакты: ссылка открывает действие, отдельная кнопка копирует в буфер с тостом COPIED.
 * Футер: полутоновой вордмарк, обрезанный нижним краем.
 */
export default function Booking() {
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef(0)
  const cta = useMagnet<HTMLAnchorElement>(14)
  const root = useRef<HTMLElement>(null)
  const gain = useRef(0)
  const glow = useRef<HTMLDivElement>(null)
  const [refract, setRefract] = useState(false)

  // «рассвет»: на входе секции почти темно, к моменту BOOK NAGOO в центре — полная яркость
  useEffect(() => {
    const el = root.current
    if (!el) return
    const update = () => {
      const top = el.getBoundingClientRect().top
      const vh = window.innerHeight
      gain.current = Math.min(1, Math.max(0, (vh - top) / (vh * 0.9)))
      if (glow.current) glow.current.style.opacity = String(gain.current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    // преломление через SVG-фильтр в backdrop-filter держит только Chromium на desktop
    const chromium = !!(navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands?.some(
      (b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand),
    )
    setRefract(chromium && window.matchMedia('(min-width: 768px) and (hover: hover)').matches)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // старые браузеры: выделение через textarea
      const t = document.createElement('textarea')
      t.value = text
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      try {
        document.execCommand('copy')
      } catch {
        document.body.removeChild(t)
        setToast(B.copyFailed)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setToast(null), 1800)
        return
      }
      document.body.removeChild(t)
    }
    setToast(text)
    setCopied(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setToast(null)
      setCopied(null)
    }, 1800)
  }, [])

  // телефон и WhatsApp — один номер: одна строка, два действия
  const rows = [
    {
      key: 'phone',
      text: contacts.phone,
      label: B.call,
      href: contacts.phoneHref,
      extra: { label: B.whatsapp, href: contacts.whatsapp },
    },
    { key: 'mail', text: contacts.email, label: B.email, href: `mailto:${contacts.email}`, extra: null },
  ]

  type Soc = { handle: string; url: string | null }
  const ig: Soc | null = contacts.instagram.url ? contacts.instagram : null
  const socials = ([contacts.facebook, contacts.soundcloud] as Soc[]).filter((x) => !!x.url)

  return (
    <section ref={root} id="booking" className="relative isolate overflow-hidden bg-ink text-bone">
      {/* фильтр преломления для стекла (Chromium desktop) */}
      <LiquidFilter />

      {/* дымка: верх растушёван в ink на ~38vh, низ уходит в ink; яркость привязана к скроллу */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0, #000 min(38vh, 380px), #000 calc(100% - 24vh), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0, #000 min(38vh, 380px), #000 calc(100% - 24vh), transparent 100%)',
        }}
      >
        <div
          ref={glow}
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(75% 55% at 50% 100%, rgba(246,101,38,.5), transparent 72%), var(--grad-glow)',
            opacity: 0,
          }}
        />
        <HazeCanvas gain={gain} />
      </div>

      <div
        className="relative mx-auto flex min-h-svh flex-col items-center justify-start gap-[clamp(20px,3.2svh,40px)] px-[var(--gutter-x)] text-center"
        style={{ paddingBlock: 'clamp(72px, 10svh, 120px) clamp(24px, 4svh, 48px)' }}
      >
        <SectionTitle lines={ui.titles.booking} className="text-center" style={{ fontSize: 'min(var(--t-xl), 13svh)' }} />

        <a
          ref={cta.ref}
          onPointerMove={cta.onPointerMove}
          onPointerLeave={cta.onPointerLeave}
          href={`mailto:${contacts.email}`}
          data-avoid-cta
          className="write-cta t-md-cond grid size-[160px] place-items-center rounded-full bg-ember text-center text-ink transition-[background-color,scale] duration-[var(--dur-s)] hover:scale-[1.08] hover:bg-ember-hot"
          style={{ transitionTimingFunction: 'var(--ease-out)' }}
        >
          {B.write}
        </a>

        <LiquidPanel refract={refract} className="w-full max-w-[760px] text-left">
        <ul data-avoid-cta className="m-0 flex list-none flex-col p-2 md:p-4">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-bone/25 px-3 py-4 first:border-t-0 md:px-4"
            >
              <a href={r.href} className="link-draw relative flex min-h-11 min-w-0 flex-col justify-center">
                <span className="t-micro block text-bone">{r.label}</span>
                <span className="t-md block truncate">{r.text}</span>
              </a>
              <span className="flex flex-wrap items-center gap-2">
                {r.extra && (
                  <a
                    href={r.extra.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-pill t-micro grid min-h-11 place-items-center rounded-full px-4"
                  >
                    {r.extra.label}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => copy(r.text)}
                  aria-label={`${B.copy}: ${r.text}`}
                  className="glass-pill t-micro flex min-h-11 items-center gap-2 rounded-full px-4 text-bone"
                >
                  {copied === r.text ? null : CopyIcon}
                  {copied === r.text ? B.copied : B.copy}
                </button>
              </span>
            </li>
          ))}
          {ig && ig.url && (
            <li className="flex items-center justify-between gap-4 border-t border-bone/25 px-3 py-4 md:px-4">
              <SocialRow href={ig.url} name="Instagram" handle={ig.handle} />
              <a
                href={ig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-pill t-micro grid min-h-11 place-items-center rounded-full px-4"
              >
                {B.open}
              </a>
            </li>
          )}
        </ul>
        </LiquidPanel>

        {socials.length > 0 && (
          <ul aria-label={B.social} className="t-micro m-0 flex list-none flex-wrap justify-center gap-3 p-0">
            {socials.map((x) => (
              <SocialLink key={x.url} href={x.url as string} label={x.handle} />
            ))}
          </ul>
        )}

        {/* DOWNLOAD PRESS KIT (PDF): появится после этапа PDF, пока скрыта */}
      </div>

      {/* футер: одна тонкая строка, дымка уходит в ink к самому низу */}
      <footer
        data-avoid-cta
        className="t-micro relative flex items-center justify-between gap-4 whitespace-nowrap px-[var(--gutter-x)] pb-[72px] pt-4"
      >
        <p className="m-0 text-bone-dim">
          © {new Date().getFullYear()} {artist.name}<span className="max-sm:hidden"> · {B.pressKit}</span>
        </p>
        <button
          type="button"
          onClick={() => scrollToId('hero')}
          className="link-draw relative inline-flex min-h-11 items-center gap-2 uppercase text-bone"
        >
          {B.back}
          <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.25">
            <path d="M4.5 14V1M1 4.5L4.5 1 8 4.5" />
          </svg>
        </button>
      </footer>

      {/* тост */}
      <p
        role="status"
        aria-live="polite"
        className="t-micro pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-bone px-5 py-3 text-ink transition-opacity duration-[var(--dur-xs)]"
        style={{ opacity: toast ? 1 : 0 }}
      >
        {toast ? (toast === B.copyFailed ? toast : `${ui.copied}: ${toast}`) : ''}
      </p>
    </section>
  )
}

function SocialRow({ href, name, handle }: { href: string; name: string; handle: string }) {
  const m = useMagnet<HTMLAnchorElement>(6)
  return (
    <a
      ref={m.ref}
      onPointerMove={m.onPointerMove}
      onPointerLeave={m.onPointerLeave}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="link-draw relative flex min-h-11 min-w-0 flex-col justify-center"
    >
      <span className="t-micro block text-bone">{name}</span>
      <span className="t-md block truncate">{handle}</span>
    </a>
  )
}

function SocialLink({ href, label }: { href: string; label: string }) {
  const m = useMagnet<HTMLAnchorElement>(8)
  return (
    <li>
      <a
        ref={m.ref}
        onPointerMove={m.onPointerMove}
        onPointerLeave={m.onPointerLeave}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border border-bone-faint px-5 py-3 transition-colors hover:border-ember hover:bg-ember hover:text-ink"
      >
        {label}
      </a>
    </li>
  )
}

/** SVG-фильтр «линзы»: карта смещения с градиентами по краям, края стекла искажают дымку за ним. */
function LiquidFilter() {
  const map =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
        '<defs>' +
        '<linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="rgb(0,128,128)"/><stop offset="1" stop-color="rgb(128,128,128)"/></linearGradient>' +
        '<linearGradient id="r" x1="0" x2="1"><stop offset="0" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(255,128,128)"/></linearGradient>' +
        '<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(128,0,128)"/><stop offset="1" stop-color="rgb(128,128,128)"/></linearGradient>' +
        '<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(128,255,128)"/></linearGradient>' +
        '</defs>' +
        '<rect width="400" height="300" fill="rgb(128,128,128)"/>' +
        '<rect width="60" height="300" fill="url(#l)"/>' +
        '<rect x="340" width="60" height="300" fill="url(#r)"/>' +
        '<rect width="400" height="50" fill="url(#t)" opacity=".9"/>' +
        '<rect y="250" width="400" height="50" fill="url(#b)" opacity=".9"/>' +
        '</svg>',
    )
  return (
    <svg aria-hidden width="0" height="0" className="absolute" focusable="false">
      <filter id="liquid" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={map} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="54" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

/** Панель «жидкое стекло»: преломление, кант-блик, подсветка за курсором, внутренний объём. */
function LiquidPanel({
  children,
  className = '',
  refract,
}: {
  children: React.ReactNode
  className?: string
  refract: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px')
    el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px')
  }
  return (
    <div
      ref={ref}
      onPointerMove={move}
      className={'liquid-glass ' + (refract ? 'liquid-refract ' : '') + className}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
