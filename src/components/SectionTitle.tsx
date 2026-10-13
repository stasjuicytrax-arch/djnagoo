import { useLayoutEffect, useRef } from 'react'
import { gsap, reducedMotion } from '@/lib/smooth'

type Props = {
  lines: string[]
  /** Дополнительные классы h2 (размер задаётся классом .t-xl). */
  className?: string
  id?: string
  /** Цвет точки в конце: ember по DESIGN §3.3. */
  dotClass?: string
  style?: React.CSSProperties
}

/**
 * Заголовок секции: капс, --t-xl, line-mask + морфинг ширины 125→62 при входе (DESIGN §7),
 * в конце точка --ember (§3.3). Анимация один раз.
 */
export default function SectionTitle({ lines, className = '', id, dotClass = 'text-ember', style }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    const inner = el.querySelectorAll<HTMLElement>('.st-in')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 110, y: 0, fontStretch: '125%', fontWeight: 900 },
        {
          yPercent: 0,
          y: 0,
          fontStretch: '62%',
          fontWeight: 800,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      )
    }, el)
    return () => {
      ctx.revert()
      gsap.set(inner, { clearProps: 'transform,fontStretch,fontWeight' })
    }
  }, [])

  return (
    <h2 ref={ref} id={id} className={`t-xl ${className}`} style={style}>
      {lines.map((line, i) => (
        <span key={line} className="block [clip-path:inset(0_-50vw)]">
          <span className="st-in block">
            {line}
            {i === lines.length - 1 && <span className={dotClass}>.</span>}
          </span>
        </span>
      ))}
    </h2>
  )
}
