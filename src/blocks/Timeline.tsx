import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { content } from '@/lib/content'
import { gsap, ScrollTrigger, reducedMotion } from '@/lib/smooth'
import SectionTitle from '@/components/SectionTitle'

const { timeline, ui } = content
const T = ui.timeline

type Stage = (typeof timeline)[number]

const range = (s: Stage) => {
  if (s.kind === 'award') return String(s.from)
  const custom = (s as { rangeLabel?: string }).rangeLabel
  const to = s.to == null ? T.now : String(s.to)
  if (custom) return `${custom} – ${to}`
  return s.from === s.to ? String(s.from) : `${s.from} – ${to}`
}
const where = (s: Stage) => [s.venue, s.place].filter(Boolean).join(' · ')

/** Одна точка этапа: текст над или под линией, у награды – ember-точка и метка AWARD. */
function StageCard({ s, i }: { s: Stage; i: number }) {
  const award = s.kind === 'award'
  const up = !award && i % 2 === 0 // награда под линией: петля свободна сверху
  return (
    <li
      data-stage
      data-award={award ? '1' : '0'}
      className={`relative shrink-0 ${award ? 'w-[min(86vw,560px)]' : 'w-[min(78vw,400px)]'} border-l border-[var(--line)] pb-[var(--space-block)] pl-5 md:grid md:h-full md:grid-rows-2 md:border-l-0 md:pb-0 md:pl-0`}
    >
      <span
        aria-hidden
        className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full md:hidden ${award ? 'bg-ember' : 'bg-bone-faint'}`}
      />
      <div className={up ? 'md:row-start-1 md:self-end md:pb-8' : 'md:row-start-2 md:self-start md:pt-8'}>
        <p className="t-micro m-0 text-bone-dim">{range(s)}</p>
        <p
          className={`m-0 mt-2 ${award ? 't-lg uppercase text-ember' : 't-md-cond'}`}
        >
          {s.title}
        </p>
        {where(s) && <p className="t-micro m-0 mt-2 text-bone-dim">{where(s)}</p>}
        {'detail' in s && s.detail && <p className="t-micro m-0 mt-1 normal-case text-bone-dim">{s.detail}</p>}
        {award && <p className="t-micro m-0 mt-3 inline-block rounded-full bg-ember px-3 py-1.5 text-ink">{T.award}</p>}
      </div>
    </li>
  )
}

const awardNode = (p: { nodes: { x: number; award: boolean }[] }) => p.nodes.find((n) => n.award)

/**
 * 05 · Timeline. Desktop: горизонтальная лента в sticky-экране (высота секции = путь ленты + экран,
 * без JS-pin). Линия с бегущим градиентом (концепт 21st gradient-tracing) рисуется по скроллу,
 * у награды 2018 делает петлю. Mobile: вертикальная лента, линия слева.
 */
export default function Timeline() {
  const outer = useRef<HTMLElement>(null)
  const track = useRef<HTMLUListElement>(null)
  const line = useRef<SVGPathElement>(null)
  const head = useRef<SVGCircleElement>(null)
  const glow = useRef<SVGCircleElement>(null)
  const tail = useRef<SVGGElement>(null)
  const flash = useRef<SVGCircleElement>(null)
  const [outerH, setOuterH] = useState<number | null>(null)
  const [path, setPath] = useState<{ d: string; w: number; h: number; nodes: { x: number; award: boolean }[] } | null>(null)
  const calm = useMemo(() => reducedMotion(), [])

  // Меряем ленту: высота секции и геометрия линии по реальным позициям карточек
  useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => {
      if (calm || !window.matchMedia('(min-width: 768px)').matches) {
        setOuterH(null)
        setPath(null)
        return
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = el.scrollWidth
      setOuterH(Math.max(vh, w - vw + vh * 1.5)) // +0.5 экрана: держим последний этап
      const mid = vh / 2
      const cards = [...el.querySelectorAll<HTMLElement>('[data-stage]')]
      const pts = cards.map((c, i) => ({
        x: c.offsetLeft + 2,
        y: mid + (i % 2 === 0 ? -1 : 1) * 0,
        award: c.dataset.award === '1',
      }))
      if (!pts.length) return
      let d = `M ${Math.max(0, pts[0].x - 120)} ${mid}`
      pts.forEach((p, i) => {
        const prev = i === 0 ? { x: Math.max(0, p.x - 120), y: mid } : pts[i - 1]
        const dx = (p.x - prev.x) / 2
        const sway = (i % 2 === 0 ? -1 : 1) * 26
        d += ` C ${prev.x + dx} ${mid + sway}, ${p.x - dx} ${mid - sway}, ${p.x} ${mid}`
        if (p.award) d += ` c 70 -120, -70 -120, 0 0`
      })
      d += ` L ${w - 40} ${mid}`
      setPath({ d, w, h: vh, nodes: pts.map((p) => ({ x: p.x, award: p.award })) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    document.fonts.ready.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Скролл: лента едет, линия дорисовывается, голова бежит
  useEffect(() => {
    const el = outer.current
    const tr = track.current
    if (!el || !tr || !path || calm) return
    const len = line.current?.getTotalLength() ?? 0
    if (line.current) {
      line.current.style.strokeDasharray = String(len)
      line.current.style.strokeDashoffset = String(len)
    }
    // длина пути в точке награды: первая точка, где x достигает узла 2018 (дальше петля)
    const aw = awardNode(path)
    let awardLen = Infinity
    if (aw && line.current) {
      for (let l = 0; l <= len; l += 3) {
        if (line.current.getPointAtLength(l).x >= aw.x - 0.5) {
          awardLen = l
          break
        }
      }
    }
    const SEG = 6
    const TAIL_PX = 150
    const segs = tail.current ? [...tail.current.querySelectorAll('path')] : []
    let flashed = false
    const ctx = gsap.context(() => {
      gsap.to(tr, {
        x: () => -(tr.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => '+=' + (tr.scrollWidth - window.innerWidth),
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            if (line.current) line.current.style.strokeDashoffset = String(len * (1 - Math.min(1, p * 1.04 + 0.02)))
            if (head.current && line.current) {
              const pt = line.current.getPointAtLength(len * Math.min(1, p * 1.04 + 0.02))
              head.current.setAttribute('cx', String(pt.x))
              head.current.setAttribute('opacity', p > 0.005 ? '1' : '0')
              head.current.setAttribute('cy', String(pt.y))
              if (glow.current) {
                glow.current.setAttribute('cx', String(pt.x))
                glow.current.setAttribute('cy', String(pt.y))
                glow.current.setAttribute('opacity', p > 0.005 ? '1' : '0')
              }
              // короткий хвост: цепочка отрезков по пути за головкой, затухает к прозрачности
              const at = len * Math.min(1, p * 1.04 + 0.02)
              const step = TAIL_PX / SEG
              let a = pt
              segs.forEach((s, k) => {
                const b = line.current!.getPointAtLength(Math.max(0, at - (k + 1) * step))
                s.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' L ' + b.x + ' ' + b.y)
                a = b
              })
              if (tail.current) tail.current.setAttribute('opacity', p > 0.005 ? '1' : '0')
              // вспышка на петле 2018 при прохождении головкой узла награды
              if (at >= awardLen && !flashed) {
                flashed = true
                flash.current?.animate(
                  [
                    { opacity: 0.95, transform: 'scale(0.4)' },
                    { opacity: 0, transform: 'scale(3.4)' },
                  ],
                  { duration: 700, easing: 'cubic-bezier(0.16,1,0.3,1)' },
                )
              } else if (at < awardLen - 40) flashed = false
            }
          },
        },
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [path, calm])

  return (
    <section
      id="timeline"
      ref={outer}
      className="relative bg-ink text-bone"
      style={outerH ? { height: outerH } : { paddingBlock: 'var(--space-section)' }}
    >
      <div className={calm ? "md:overflow-x-auto" : "md:sticky md:top-0 md:h-svh md:overflow-hidden"}>
        <ul
          ref={track}
          className={`timeline-track relative m-0 flex list-none flex-col gap-0 px-[var(--gutter-x)] p-0 md:w-max md:flex-row md:items-stretch md:gap-[6vw] ${calm ? "md:min-h-[70svh]" : "md:h-svh"}`}
        >
          <li className="shrink-0 pb-[var(--space-block)] md:flex md:w-[min(44vw,640px)] md:pb-0 md:flex-col md:justify-center">
            <SectionTitle lines={ui.titles.timeline} />
            <p className="t-micro mt-[var(--space-tight)] text-bone-dim">
              {timeline[0].from} – {T.now}
            </p>
          </li>
          {timeline.map((s, i) => (
            <StageCard key={`${s.from}-${s.title}-${i}`} s={s} i={i} />
          ))}
          <li aria-hidden className="hidden w-[12vw] shrink-0 md:block" />
          {/* линия едет вместе с лентой: внутри трека */}
          <li aria-hidden className="pointer-events-none absolute left-0 top-0 hidden md:block">
          {/* линия: только desktop */}
          {path && (
            <>
            <svg
              aria-hidden
                width={path.w}
              height={path.h}
              viewBox={`0 0 ${path.w} ${path.h}`}
              >
              <defs>
                <radialGradient id="tl-comet">
                  <stop offset="0" stopColor="#ff8a3d" stopOpacity=".9" />
                  <stop offset=".45" stopColor="#f66526" stopOpacity=".4" />
                  <stop offset="1" stopColor="#f66526" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="tl-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={path.w} y2="0">
                  <stop offset="0" style={{ stopColor: "var(--crimson)" }} />
                  <stop offset=".38" style={{ stopColor: "var(--red)" }} />
                  <stop offset=".82" style={{ stopColor: "var(--ember)" }} />
                  <stop offset="1" style={{ stopColor: "var(--ember-hot)" }} />
                </linearGradient>
              </defs>
              <path d={path.d} fill="none" stroke="var(--line)" strokeWidth="1" />
              <path ref={line} d={path.d} fill="none" stroke="url(#tl-grad)" strokeWidth="2.5" strokeLinecap="round" />
              {path.nodes.map((n, k) => (
              <circle key={k} cx={n.x} cy={path.h / 2} r={n.award ? 7 : 4} fill={n.award ? "var(--ember)" : "var(--bone-faint)"} />
            ))}
            </svg>
            {/* комета: отдельный слой поверх линии */}
            <svg aria-hidden width={path.w} height={path.h} viewBox={`0 0 ${path.w} ${path.h}`} className="absolute left-0 top-0">
            {awardNode(path) && (
              <circle
                ref={flash}
                cx={awardNode(path)!.x}
                cy={path.h / 2}
                r="18"
                fill="none"
                stroke="var(--ember-hot)"
                strokeWidth="2"
                opacity="0"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            <g ref={tail} opacity="0">
              {Array.from({ length: 6 }, (_, k) => (
                <path
                  key={k}
                  fill="none"
                  stroke="var(--bone)"
                  strokeLinecap="round"
                  strokeWidth={3.8 - k * 0.5}
                  opacity={0.9 - k * 0.15}
                />
              ))}
            </g>
            <circle ref={glow} r="15" fill="url(#tl-comet)" cx="0" cy={path.h / 2} opacity="0" />
            <circle ref={head} r="4.5" fill="var(--bone)" cx="0" cy={path.h / 2} opacity="0" />
            </svg>
            </>
          )}
          </li>
        </ul>
      </div>
    </section>
  )
}
