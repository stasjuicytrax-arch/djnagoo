import { useEffect, useRef } from 'react'
import { content } from '@/lib/content'
import { scrollToId } from '@/lib/smooth'
import { useActiveSection } from '@/lib/useActiveSection'
import Logo from '@/components/Logo'

const { ui, artist } = content
const pad = (n: number) => String(n).padStart(2, '0')

/** Рамка видоискателя: четыре угла, всегда поверх контента (DESIGN.md §4, TZ §4). */
export default function Frame() {
  const index = useActiveSection()
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
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

  return (
    <div
      className="t-micro pointer-events-none fixed inset-0 z-40 text-bone"
      style={{ padding: 'max(var(--gutter-x), env(safe-area-inset-top)) var(--gutter-x)' }}
    >
      {/* ↖ логотип */}
      <a
        href="#hero"
        onClick={go('hero')}
        aria-label={artist.name}
        className="pointer-events-auto absolute left-[var(--gutter-x)] top-5 block w-[72px] md:w-24"
      >
        <Logo className="block w-full" />
      </a>

      {/* ↗ меню */}
      <nav
        aria-label="Sections"
        className="pointer-events-auto absolute right-[var(--gutter-x)] top-5 flex gap-5 rounded-full px-4 py-2 backdrop-blur-[14px]"
        style={{ background: 'rgba(11,9,8,.5)' }}
      >
        {ui.nav.map((n, i) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={go(n.id)}
            className={`link-draw ${i < ui.nav.length - 1 ? 'hidden md:inline' : ''}`}
          >
            {n.label}
          </a>
        ))}
      </nav>

      {/* ↙ live */}
      <p className="absolute bottom-5 left-[var(--gutter-x)] flex items-center gap-2">
        <span aria-hidden className="inline-block size-2 rounded-full bg-ember" />
        {ui.live} {artist.base}
      </p>

      {/* ↘ номер секции + прогресс */}
      <div className="absolute bottom-5 right-[var(--gutter-x)] flex flex-col items-end gap-2">
        <p aria-live="off" className="tabular-nums">
          {pad(index + 1)} / {pad(ui.sections.length)}
        </p>
        <span className="block h-px w-24 overflow-hidden bg-[var(--line)]" aria-hidden>
          <span ref={bar} className="block h-full origin-left bg-ember" style={{ transform: 'scaleX(0)' }} />
        </span>
      </div>
    </div>
  )
}
