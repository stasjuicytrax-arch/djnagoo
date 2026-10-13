import { useEffect, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { scrollToId } from '@/lib/smooth'

/** Плавающая CTA: круг 72px ember, появляется после Hero, ведёт к Booking (TZ §4). */
export default function FloatingCta() {
  const [show, setShow] = useState(false)
  const [covered, setCovered] = useState(false)
  // блоки монтируются лениво и заменяют заглушки: наблюдатели пересоздаём по событию
  const [gen, setGen] = useState(0)
  useEffect(() => {
    const f = () => setGen((g) => g + 1)
    window.addEventListener('nagoo:sections', f)
    return () => window.removeEventListener('nagoo:sections', f)
  }, [])
  const btn = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const hero = document.getElementById('hero')
    const booking = document.getElementById('booking')
    if (!hero) return
    let pastHero = false
    let atBooking = false
    const sync = () => setShow(pastHero && !atBooking)
    const a = new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting
      sync()
    })
    a.observe(hero)
    const b = booking
      ? new IntersectionObserver(([e]) => {
          atBooking = e.intersectionRatio > 0.35
          sync()
        }, { threshold: [0, 0.35, 1] })
      : null
    if (booking) b?.observe(booking)
    return () => {
      a.disconnect()
      b?.disconnect()
    }
  }, [gen])

  // Кружок прячется, пока под ним текст или горячий фон: любой [data-avoid-cta] в зоне кнопки
  useEffect(() => {
    let raf = 0
    const check = () => {
      const b = btn.current?.getBoundingClientRect()
      if (!b) return
      const pad = 20
      const hit = [...document.querySelectorAll('[data-avoid-cta]')].some((n) => {
        const r = n.getBoundingClientRect()
        return r.bottom > b.top - pad && r.top < b.bottom + pad && r.right > b.left - pad && r.left < b.right + pad
      })
      setCovered((p) => (p === hit ? p : hit))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  const visible = show && !covered

  // Магнитное притяжение ±12px (desktop)
  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse' || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    btn.current.style.translate = `${dx * 12}px ${dy * 12}px`
  }
  const onLeave = () => {
    if (btn.current) btn.current.style.translate = '0 0'
  }

  return (
    <a
      ref={btn}
      href="#booking"
      onClick={(e) => {
        e.preventDefault()
        scrollToId('booking')
      }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className="t-micro fixed bottom-[calc(64px+env(safe-area-inset-bottom))] right-[var(--gutter-x)] z-40 grid size-[72px] place-items-center rounded-full bg-ember text-center leading-tight text-ink hover:bg-ember-hot cta-circle"
      style={{
        opacity: visible ? 1 : 0,
        scale: visible ? '1' : '0.6',
        pointerEvents: visible ? 'auto' : 'none',
        transition:
          'opacity var(--dur-s) var(--ease-out), scale var(--dur-m) var(--ease-out), translate var(--dur-s) var(--ease-out), background-color var(--dur-xs)',
      }}
    >
      <span className="px-2">{content.ui.floatingCta}</span>
    </a>
  )
}
