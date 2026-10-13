import { useEffect, useRef, useState } from 'react'
import { content } from '@/lib/content'

type Kind = keyof typeof content.ui.cursor

/**
 * Кастомный курсор (desktop): точка 8px ember → круг 72px с подписью над [data-cursor="play|view|drag"].
 * Только transform/opacity. На touch и reduced-motion не монтируется.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [kind, setKind] = useState<Kind | null>(null)
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(fine && !calm)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    let x = -100,
      y = -100,
      cx = x,
      cy = y,
      raf = 0
    const loop = () => {
      cx += (x - cx) * 0.22
      cy += (y - cy) * 0.22
      if (el.current) el.current.style.transform = `translate3d(${cx}px,${cy}px,0)`
      raf = requestAnimationFrame(loop)
    }
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = (e.target as Element | null)?.closest?.('[data-cursor]') as HTMLElement | null
      setKind((t?.dataset.cursor as Kind | undefined) ?? null)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={el} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60]">
      <div
        className="t-micro -ml-1 -mt-1 grid place-items-center rounded-full bg-ember text-ink"
        style={{
          width: 8,
          height: 8,
          transform: kind ? 'scale(9)' : 'none',
          transition: 'transform var(--dur-s) var(--ease-out)',
        }}
      />
      {kind && (
        <span className="t-micro absolute left-0 top-0 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center text-center text-ink">
          {content.ui.cursor[kind]}
        </span>
      )}
    </div>
  )
}
