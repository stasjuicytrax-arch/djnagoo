import { useEffect, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { scrollToId } from '@/lib/smooth'
import { useActiveSection } from '@/lib/useActiveSection'
import Logo from '@/components/Logo'

const { ui, artist } = content
const pad = (n: number) => String(n).padStart(2, '0')

type Corners = { tl: boolean; tr: boolean; bl: boolean; br: boolean } // true = текст --ink

const BONE_ALL: Corners = { tl: false, tr: false, bl: false, br: false }

/**
 * Какой цвет текста у каждого угла рамки — по тому, что под ним сейчас.
 * manifest: светлая пауза (--bone) → ink во всех углах.
 * hero (desktop): справа под углами горячий ember (bone на нём 2.6:1) → ink, пока фото не затемнилось скроллом.
 */
function readCorners(): Corners {
  const vh = window.innerHeight
  const desktop = window.matchMedia('(min-width: 768px)').matches
  const at = (y: number) => {
    for (const id of ui.sections) {
      const r = document.getElementById(id)?.getBoundingClientRect()
      if (r && r.top <= y && r.bottom > y) return id
    }
    return null
  }
  const top = at(40)
  const bottom = at(vh - 40)
  const heroRight = desktop && window.scrollY < vh * 0.45
  return {
    tl: top === 'manifest',
    tr: top === 'manifest' || (top === 'hero' && heroRight),
    bl: bottom === 'manifest',
    br: bottom === 'manifest' || (bottom === 'hero' && heroRight),
  }
}

const same = (a: Corners, b: Corners) => a.tl === b.tl && a.tr === b.tr && a.bl === b.bl && a.br === b.br
const ink = (on: boolean) => (on ? 'text-ink' : 'text-bone')

/** Рамка видоискателя: четыре угла, всегда поверх контента (DESIGN.md §4, TZ §4). */
export default function Frame() {
  const index = useActiveSection()
  const bar = useRef<HTMLSpanElement>(null)
  const [c, setC] = useState<Corners>(BONE_ALL)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const next = readCorners()
      setC((prev) => (same(prev, next) ? prev : next))
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToId(id)
  }

  const tone = 'transition-colors duration-[var(--dur-xs)]'
  const inHero = index === 0

  return (
    <div
      className="frame t-micro pointer-events-none fixed inset-0 z-40 px-[var(--gutter-x)]"
      style={{
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      }}
    >
      {/* верхний ряд: ↖ логотип · ↗ меню, на одной оси */}
      <div className="flex items-center justify-between">
        <a
          href="#hero"
          onClick={go('hero')}
          aria-label={`${artist.name}: back to top`}
          className={`pointer-events-auto relative block w-[88px] md:w-24 before:absolute before:-inset-3 before:content-[''] ${tone} ${ink(c.tl)}`}
        >
          <Logo className="block w-full" />
        </a>

        <nav
          aria-label="Sections"
          className={`pointer-events-auto flex items-center gap-6 rounded-full px-5 py-2.5 backdrop-blur-[14px] md:-mr-5 ${tone} ${ink(c.tr)} ${
            c.tr ? 'bg-bone/55' : 'bg-ink/50'
          } max-md:gap-0 max-md:bg-transparent max-md:p-0 max-md:backdrop-blur-none ${
            inHero ? '' : 'max-md:invisible'
          }`}
        >
          {ui.nav.map((n, i) => {
            const last = i === ui.nav.length - 1
            return (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={go(n.id)}
                className={
                  last
                    ? 'link-draw relative py-1 before:absolute before:-inset-x-3 before:-inset-y-3 before:content-[""] max-md:inline-flex max-md:h-11 max-md:items-center max-md:rounded-full max-md:bg-ember max-md:px-5 max-md:text-ink'
                    : 'link-draw relative hidden py-1 before:absolute before:-inset-x-3 before:-inset-y-3 before:content-[""] md:inline-block'
                }
              >
                {n.label}
              </a>
            )
          })}
        </nav>
      </div>

      {/* ↙ live */}
      <p className={`absolute bottom-[max(20px,env(safe-area-inset-bottom))] left-[var(--gutter-x)] flex items-center gap-2 ${tone} ${ink(c.bl)}`}>
        <span aria-hidden className="inline-block size-2 rounded-full bg-ember" />
        {ui.live} {artist.base}
      </p>

      {/* ↘ номер секции + прогресс */}
      <div
        className={`absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-[var(--gutter-x)] flex flex-col items-end gap-2 ${tone} ${ink(c.br)}`}
      >
        <p className="tabular-nums" aria-label={`Section ${index + 1} of ${ui.sections.length}`}>
          {pad(index + 1)} / {pad(ui.sections.length)}
        </p>
        <span className="block h-px w-24 overflow-hidden bg-current/25" aria-hidden>
          <span ref={bar} className="block h-full origin-left bg-current" style={{ transform: 'scaleX(0)' }} />
        </span>
      </div>
    </div>
  )
}
