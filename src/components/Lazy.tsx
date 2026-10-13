import { useEffect, useRef, useState, type ComponentType } from 'react'
import { ScrollTrigger } from '@/lib/smooth'

type Loader = () => Promise<{ default: ComponentType }>

/**
 * Блок ниже первого экрана подгружается, когда подходит к вьюпорту (rootMargin 150%), а после
 * первой отрисовки чанки докачиваются в простое. Пока блок не смонтирован, на его месте
 * заглушка с тем же id (якорь меню работает) и оценочной высотой.
 */
export default function Lazy({ id, load, minHeight }: { id: string; load: Loader; minHeight: string }) {
  const [Comp, setComp] = useState<ComponentType | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    let started = false
    const mount = () => {
      if (started) return
      started = true
      void load().then((m) => {
        if (!alive) return
        setComp(() => m.default)
        // высота страницы изменилась: пересчитать триггеры
        window.setTimeout(() => ScrollTrigger.refresh(), 120)
      })
    }
    // ?eager и /print: смонтировать сразу (проверки детектором, Playwright, PDF)
    if (new URLSearchParams(window.location.search).has('eager') || window.location.pathname.endsWith('/print')) mount()
    const io = new IntersectionObserver(([e]) => e.isIntersecting && mount(), { rootMargin: '150% 0px' })
    if (ref.current) io.observe(ref.current)
    // меню/CTA просят все блоки сразу, чтобы прыжок к якорю был точным
    window.addEventListener('nagoo:load-all', mount)
    return () => {
      alive = false
      io.disconnect()
      window.removeEventListener('nagoo:load-all', mount)
    }
  }, [load])

  if (Comp) return <Comp />
  return <div ref={ref} id={id} aria-hidden style={{ minHeight }} />
}
