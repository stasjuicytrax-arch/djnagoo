import { useCallback, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { scrollToId } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'
import HazeCanvas from '@/components/HazeCanvas'
import HalftoneFooter from '@/components/HalftoneFooter'

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
        /* ничего: тост не показываем */
        document.body.removeChild(t)
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
    <section id="booking" className="relative isolate overflow-hidden bg-ink text-bone">
      {/* статичный градиент: пока нет WebGL и в reduced-motion */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{ backgroundImage: 'var(--grad-glow)' }}
      />
      <HazeCanvas className="-z-10" />

      <div
        className="relative mx-auto flex min-h-svh flex-col items-center justify-center gap-[var(--space-block)] px-[var(--gutter-x)] text-center"
        style={{ paddingBlock: 'var(--space-section) var(--space-block)' }}
      >
        <SectionTitle lines={ui.titles.booking} className="text-center" />

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

        <ul
          data-avoid-cta
          className="m-0 flex w-full max-w-[760px] list-none flex-col rounded-[20px] bg-ink/70 p-2 text-left md:p-4"
        >
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-bone/40 px-3 py-4 first:border-t-0 md:px-4"
            >
              <a href={r.href} className="link-draw relative min-w-0">
                <span className="t-micro block text-bone">{r.label}</span>
                <span className="t-md block truncate">{r.text}</span>
              </a>
              <span className="flex flex-wrap items-center gap-2">
                {r.extra && (
                  <a
                    href={r.extra.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-micro grid min-h-11 place-items-center rounded-full border border-bone/60 px-4 transition-colors hover:border-ember hover:bg-ember hover:text-ink"
                  >
                    {r.extra.label}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => copy(r.text)}
                  aria-label={`${B.copy}: ${r.text}`}
                  className="t-micro flex min-h-11 items-center gap-2 rounded-full border border-bone/60 px-4 text-bone transition-colors hover:border-ember hover:bg-ember hover:text-ink"
                >
                  {copied === r.text ? null : CopyIcon}
                  {copied === r.text ? B.copied : B.copy}
                </button>
              </span>
            </li>
          ))}
          {ig && ig.url && (
            <li className="flex items-center justify-between gap-4 border-t border-bone/40 px-3 py-4 md:px-4">
              <SocialRow href={ig.url} name="Instagram" handle={ig.handle} />
            </li>
          )}
        </ul>

        {socials.length > 0 && (
          <ul aria-label={B.social} className="t-micro m-0 flex list-none flex-wrap justify-center gap-3 p-0">
            {socials.map((x) => (
              <SocialLink key={x.url} href={x.url as string} label={x.handle} />
            ))}
          </ul>
        )}

        {/* DOWNLOAD PRESS KIT (PDF): появится после этапа PDF, пока скрыта */}
      </div>

      {/* футер */}
      <footer data-avoid-cta className="relative bg-ink">
        <HalftoneFooter />
        <div className="t-micro flex flex-wrap items-center justify-between gap-4 bg-ink px-[var(--gutter-x)] pb-16 pt-5 pr-[calc(var(--gutter-x)+120px)]">
          <p className="m-0 text-bone-dim">
            © {new Date().getFullYear()} {artist.name} · {B.pressKit}
          </p>
          <button
            type="button"
            onClick={() => scrollToId('hero')}
            className="link-draw relative py-2 uppercase text-bone"
          >
            {B.back}
          </button>
        </div>
      </footer>

      {/* тост */}
      <p
        role="status"
        aria-live="polite"
        className="t-micro pointer-events-none fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-bone px-5 py-3 text-ink transition-opacity duration-[var(--dur-xs)]"
        style={{ opacity: toast ? 1 : 0 }}
      >
        {toast ? `${ui.copied}: ${toast}` : ''}
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
      className="link-draw relative min-w-0"
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
