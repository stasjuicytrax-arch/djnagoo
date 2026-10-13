import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null
export const getLenis = () => lenis

/** Один Lenis на страницу, синхронизирован с ScrollTrigger. */
export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis = instance
    instance.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => instance.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenis = null
    }
  }, [])
}

/** Скролл к якорю: через Lenis, если он есть. */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: 'auto' })
}

export { gsap, ScrollTrigger }
