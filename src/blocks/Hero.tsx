import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { content, assetUrl } from '@/lib/content'
import { gsap, ScrollTrigger, reducedMotion } from '@/lib/smooth'
import { useIntroDone } from '@/lib/intro'
import Barcode from '@/components/Barcode'

const { artist, hero, ui } = content

/** Артист на desktop масштабируется от нижнего края: голова входит в вордмарк ~на 40% высоты букв. */
const CUTOUT_SCALE = 0.85
const DESKTOP = '(min-width: 768px)'

/** Готов ли слой с артистом. Без него вордмарк ляжет на лицо, поэтому ждём decode(). */
function useCutoutReady() {
  const [ready, setReady] = useState(() => !hero.cutout)
  useEffect(() => {
    if (!hero.cutout) return
    const mq = window.matchMedia(DESKTOP)
    let alive = true
    const check = () => {
      if (!mq.matches) return setReady(true) // на мобильном cutout не используется
      setReady(false)
      const img = new Image()
      img.src = assetUrl(hero.cutout!)
      const done = () => alive && setReady(true)
      if (img.decode) img.decode().then(done, done)
      else img.onload = img.onerror = done
    }
    check()
    mq.addEventListener('change', check)
    return () => {
      alive = false
      mq.removeEventListener('change', check)
    }
  }, [])
  return ready
}

/**
 * 01 · Hero. Слои: чистый фон → вордмарк → cutout артиста → микро-лейблы.
 * Секция высотой 200svh с sticky-экраном внутри: никакого JS-pin, поэтому нечему рассинхронизироваться
 * с Lenis или ресайзом. Scrub: вордмарк ×1.4 вверх, градиент темнеет в ink.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const wordmark = useRef<HTMLHeadingElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const cutout = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const side = useRef<HTMLDivElement>(null)
  const intro = useIntroDone()
  const mediaReady = useCutoutReady()
  const go = intro && mediaReady

  // Mouse-parallax: свойство `translate`, независимое от scrub (transform)
  useEffect(() => {
    if (reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5
      ty = e.clientY / window.innerHeight - 0.5
    }
    const loop = () => {
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      root.current?.style.setProperty('--mx', cx.toFixed(4))
      root.current?.style.setProperty('--my', cy.toFixed(4))
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Scroll-scrub по обёртке 200svh: ровно один экран прокрутки, пока sticky держит кадр
  useLayoutEffect(() => {
    if (reducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      tl.to(wordmark.current, { scale: 1.4, yPercent: -55 }, 0)
        .to(photo.current, { yPercent: -4 }, 0)
        .to(cutout.current, { yPercent: -2 }, 0)
        .to(side.current, { opacity: 0, duration: 0.3 }, 0)
        .to(shade.current, { opacity: 1 }, 0.15)
    }, root)
    return () => ctx.revert()
  }, [])

  // Размеры страницы меняются после шрифтов и картинок: пересчитать триггеры
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [])
  useEffect(() => {
    if (mediaReady) ScrollTrigger.refresh()
  }, [mediaReady])

  return (
    <section
      id="hero"
      ref={root}
      data-intro={go ? 'in' : 'out'}
      className="hero relative h-[200svh] w-full"
      style={{ ['--mx' as string]: 0, ['--my' as string]: 0 }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-ink">
        {/* слой 1: фон (desktop — чистая плашка без артиста, mobile — вертикальный кадр) */}
        <div ref={photo} className="absolute inset-0 will-change-transform">
          <picture
            className="hero-photo absolute inset-x-[-3%] top-[-3%] block h-[109%]"
            style={{ translate: 'calc(var(--mx) * 16px) calc(var(--my) * 16px)' }}
          >
            <source media={DESKTOP} srcSet={assetUrl(hero.plate)} />
            <img
              src={assetUrl(hero.vertical)}
              alt=""
              {...{ fetchpriority: 'high' }}
              decoding="async"
              className="size-full object-cover object-[50%_30%]"
            />
          </picture>
        </div>

        {/* слой 2: вордмарк */}
        <h1
          ref={wordmark}
          className="hero-wordmark t-mega pointer-events-none absolute inset-x-0 z-[1] m-0 select-none text-center will-change-transform"
          style={{ fontSize: 'var(--wm-size)' }}
        >
          <span className="block" style={{ translate: 'calc(var(--mx) * -32px) calc(var(--my) * -32px)' }}>
            {artist.wordmark}
          </span>
        </h1>

        {/* слой 3: артист без фона (desktop) */}
        {hero.cutout && (
          <div
            ref={cutout}
            className="hero-cutout pointer-events-none absolute inset-0 z-[2] hidden will-change-transform md:block"
          >
            {/* масштаб на внутреннем слое: GSAP управляет transform внешнего и не трогает этот */}
            <div className="absolute inset-0" style={{ scale: String(CUTOUT_SCALE), transformOrigin: '50% 100%' }}>
            <img
              src={assetUrl(hero.cutout)}
              alt={hero.description}
              decoding="async"
              className="absolute inset-x-[-3%] top-[-3%] h-[109%] w-[106%] max-w-none object-cover object-[50%_30%]"
              style={{ translate: 'calc(var(--mx) * 8px) calc(var(--my) * 8px)' }}
            />
            </div>
          </div>
        )}

        {/* мобильный: картинка без cutout, описание для скринридеров */}
        <span className="sr-only md:hidden">{hero.description}</span>

        {/* затемнение в ink при скролле */}
        <div ref={shade} aria-hidden className="absolute inset-0 z-[3] bg-ink opacity-0" />

        {/* микро-лейблы */}
        <div className="t-micro pointer-events-none absolute inset-0 z-[4] px-[var(--gutter-x)] text-bone">
          <div ref={side} className="absolute inset-0">
            <ul className="absolute right-[var(--gutter-x)] top-[84px] m-0 list-none p-0 text-right leading-[1.7] text-ink md:left-[var(--gutter-x)] md:right-auto md:top-[38%] md:text-left md:text-bone">
              <li>{artist.role}</li>
              <li>Since {artist.since}</li>
              <li>{artist.base}</li>
            </ul>

            <p className="absolute right-[calc(var(--gutter-x)+36px)] top-1/2 hidden -translate-y-1/2 text-ink [writing-mode:vertical-rl] md:block">
              {artist.tagline}
              <span className="text-bone">.</span>
            </p>

            <Barcode
              text={`${artist.wordmark}-${artist.since}`}
              className="absolute right-[var(--gutter-x)] top-1/2 hidden h-48 -translate-y-1/2 text-ink md:block"
            />

            <p className="absolute bottom-14 left-[var(--gutter-x)] hidden items-center gap-2 text-bone md:flex">
              {ui.scroll}
              <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.25">
                <path d="M4.5 0v13M1 9.5l3.5 3.5L8 9.5" />
              </svg>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
