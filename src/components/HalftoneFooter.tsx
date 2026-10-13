import { useEffect, useRef } from 'react'
import { content } from '@/lib/content'
import { reducedMotion } from '@/lib/smooth'

const WORD = content.artist.wordmark

/**
 * Футер: огромный вордмарк, обрезанный нижним краем и напечатанный полутоновыми точками;
 * точки отталкиваются от курсора и возвращаются (концепт 21st halftone-wordmark-footer).
 * Цвет точек: ember сверху → ink к обрезанному краю.
 */
export default function HalftoneFooter() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const calm = reducedMotion()
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    type Dot = { x: number; y: number; r: number; ox: number; oy: number; vx: number; vy: number; c: string }
    let dots: Dot[] = []
    let W = 0
    let H = 0
    let dpr = 1

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.floor(canvas.getBoundingClientRect().width)
      // слово в сжатой ширине (wdth 62): так оно вытягивается в высоту и по-настоящему огромное
      const probe = document.createElement('canvas').getContext('2d')!
      probe.font = '900 100px Archivo'
      ;(probe as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = 'extra-condensed'
      const ratio = probe.measureText(WORD).width / 100
      const fs = (W * 0.98) / ratio
      // видимая часть = 70% высоты капители (≈0.72 fs): слово режется нижним краем
      H = Math.max(150, Math.round(fs * 0.72 * 0.9))
      canvas.style.height = H + 'px'
      canvas.width = W * dpr
      canvas.height = H * dpr
      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      const o = off.getContext('2d')!
      o.font = `900 ${fs}px Archivo`
      ;(o as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = 'extra-condensed'
      const w = o.measureText(WORD).width
      o.fillStyle = '#fff'
      o.textBaseline = 'alphabetic'
      o.fillText(WORD, (W - w) / 2, H + fs * 0.72 * 0.1) // базовая линия ниже края на 10% капители: имя читается
      const img = o.getImageData(0, 0, W, H).data
      const step = Math.max(7, Math.round(W / 150))
      dots = []
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const a = img[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] / 255
          if (a < 0.2) continue
          const t = Math.min(1, Math.max(0, (y / H - 0.72) / 0.28))
          const k = t * t * (3 - 2 * t) // ember почти до края, затухание только в последней четверти
          // ember → ink
          const rr = Math.round(246 + (11 - 246) * k)
          const gg = Math.round(101 + (9 - 101) * k)
          const bb = Math.round(38 + (8 - 38) * k)
          dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, r: step * 0.5 * (0.45 + 0.55 * a), c: `rgb(${rr},${gg},${bb})` })
        }
      }
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      for (const d of dots) {
        ctx.fillStyle = d.c
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let px = -9999
    let py = -9999
    let raf = 0
    let visible = false
    const R = 110
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      for (const d of dots) {
        const dx = d.x - px
        const dy = d.y - py
        const dist2 = dx * dx + dy * dy
        if (dist2 < R * R) {
          const dist = Math.sqrt(dist2) || 1
          const f = (1 - dist / R) * 5
          d.vx += (dx / dist) * f
          d.vy += (dy / dist) * f
        }
        d.vx += (d.ox - d.x) * 0.06
        d.vy += (d.oy - d.y) * 0.06
        d.vx *= 0.82
        d.vy *= 0.82
        d.x += d.vx
        d.y += d.vy
      }
      draw()
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
    }
    const onLeave = () => {
      px = py = -9999
    }

    const start = () => {
      build()
      draw()
    }
    // шрифт должен быть загружен до замера
    document.fonts.load("900 100px 'Archivo'").then(start, start)

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    const ro = new ResizeObserver(() => build())
    ro.observe(canvas)

    if (!calm && fine) {
      canvas.addEventListener('pointermove', onMove, { passive: true })
      canvas.addEventListener('pointerleave', onLeave)
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} role="img" aria-label={WORD} className="block w-full" />
}
