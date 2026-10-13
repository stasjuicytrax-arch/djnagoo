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
    // меню стоит на тёмном стекле: ink только на светлом Manifest, где стекло bone
    tr: top === 'manifest',
    bl: bottom === 'manifest',
    // справа под счётчиком у Stats горячий ember (bone на нём 2.6:1)
    br: bottom === 'manifest' || (bottom === 'hero' && heroRight),
  }
}

/**
 * Какие углы рамки сейчас лежат под крупным заголовком (h1/h2): их прячем (fade),
 * чтобы логотип не торчал из-под «L I V E.» и меню не перечёркивало буквы.
 */
function readCovered(): Corners {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const zones = {
    tl: { l: 0, r: 220, t: 0, b: 72 },
    tr: { l: vw - 560, r: vw, t: 0, b: 78 },
    bl: { l: 0, r: 300, t: vh - 64, b: vh },
    br: { l: vw - 220, r: vw, t: vh - 84, b: vh },
  } as const
  const hit: Corners = { tl: false, tr: false, bl: false, br: false }
  document.querySelectorAll('h1, h2').forEach((h) => {
    const rb = h.getBoundingClientRect()
    if (rb.bottom < 0 || rb.top > vh) return
    const range = document.createRange()
    range.selectNodeContents(h)
    const rects = [...range.getClientRects()]
    for (const r of rects) {
      if (r.width < 4 || r.height < 4) continue
      for (const k of ['tl', 'tr', 'bl', 'br'] as const) {
        const z = zones[k]
        // em-блок шире видимых глифов: учитываем ~64% высоты (капитель)
        const top = r.top + r.height * 0.18
        const bottom = r.bottom - r.height * 0.18
        if (r.right > z.l && r.left < z.r && bottom > z.t && top < z.b) hit[k] = true
      }
    }
  })
  return hit
}

const same = (a: Corners, b: Corners) => a.tl === b.tl && a.tr === b.tr && a.bl === b.bl && a.br === b.br
const ink = (on: boolean) => (on ? 'text-ink' : 'text-bone')

/** Рамка видоискателя: четыре угла, всегда поверх контента (DESIGN.md §4, TZ §4). */
export default function Frame() {
  const index = useActiveSection()
  const bar = useRef<HTMLSpanElement>(null)
  const [c, setC] = useState<Corners>(BONE_ALL)
  const [cov, setCov] = useState<Corners>(BONE_ALL)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const next = readCorners()
      setC((prev) => (same(prev, next) ? prev : next))
      const cov = readCovered()
      setCov((prev) => (prev.tl === cov.tl && prev.tr === cov.tr && prev.bl === cov.bl && prev.br === cov.br ? prev : cov))
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
      {/* на светлой секции контент уходит под рамку: мягкая подложка bone, чтобы микротекст не налезал на текст */}
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-20 transition-opacity duration-[var(--dur-xs)] ${c.tl ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to bottom, var(--bone) 40%, transparent)' }}
      />
      <div
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-20 transition-opacity duration-[var(--dur-xs)] ${c.bl ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(to top, var(--bone) 40%, transparent)' }}
      />

      {/* верхний ряд: ↖ логотип · ↗ меню, на одной оси */}
      <div className="flex items-center justify-between">
        <a
          href="#hero"
          onClick={go('hero')}
          aria-label={`${artist.name}: back to top`}
          className={`pointer-events-auto relative -my-4 block w-[88px] py-4 transition-opacity duration-[var(--dur-s)] md:w-24 before:absolute before:-inset-x-3 before:inset-y-0 before:content-[''] ${tone} ${ink(c.tl)} ${
            inHero ? 'max-md:pointer-events-none max-md:opacity-0' : ''
          } ${cov.tl ? '!pointer-events-none !opacity-0' : ''}`}
        >
          <Logo className="block w-full" />
        </a>

        <nav
          aria-label="Sections"
          className={`pointer-events-auto flex items-center gap-6 rounded-full px-5 py-2.5 backdrop-blur-[14px] md:-mr-5 ${tone} ${ink(c.tr)} ${
            c.tr ? 'bg-bone/55' : 'bg-ink/50'
          } max-md:gap-0 max-md:bg-transparent max-md:p-0 max-md:backdrop-blur-none ${
            inHero ? '' : 'max-md:invisible'
          } transition-opacity ${cov.tr ? 'pointer-events-none opacity-0' : ''}`}
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
                    ? 'relative inline-flex items-center rounded-full bg-ember px-4 py-1.5 text-ink transition-colors hover:bg-ember-hot before:absolute before:-inset-x-2 before:-inset-y-3 before:content-[""] max-md:h-11 max-md:px-5'
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
      <p className={`absolute bottom-[max(20px,env(safe-area-inset-bottom))] left-[var(--gutter-x)] flex items-center gap-2 transition-opacity ${tone} ${ink(c.bl)} ${cov.bl ? 'opacity-0' : ''}`}>
        <span aria-hidden className="inline-block size-2 rounded-full bg-ember" />
        {ui.live} {artist.base}
      </p>

      {/* ↘ номер секции + прогресс */}
      <div
        className={`absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-[var(--gutter-x)] flex flex-col items-end gap-2 transition-opacity ${tone} ${ink(c.br)} ${cov.br ? 'opacity-0' : ''}`}
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
