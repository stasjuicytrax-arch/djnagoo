import { useLayoutEffect, useRef } from 'react'
import { content, assetUrl } from '@/lib/content'
import { gsap, reducedMotion } from '@/lib/smooth'

const { manifest, bio, artist, press } = content
const photo = press.find((p) => p.src.includes('press-02'))!

/**
 * 02 · Manifest: светлая пауза (--bone). Заголовок со 2-й по 3-ю строку входит с 5-й колонки (SEKO).
 * Строки: line-mask + морфинг ширины 125→62. Последняя строка «бледная» (ink 50%: 30% из DESIGN не проходит AA 3:1 на bone) и дозаливается скроллом.
 */
export default function Manifest() {
  const root = useRef<HTMLElement>(null)
  const lines = manifest.headline
  const last = lines.length - 1

  useLayoutEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    const ctx = gsap.context(() => {
      const inner = gsap.utils.toArray<HTMLElement>('.m-line-in')
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
        scrollTrigger: { trigger: el.querySelector('.m-title'), start: 'top 82%', once: true },
        },
      )

      gsap.fromTo(
        '.m-fill',
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: '.m-title', start: 'top 75%', end: 'top 30%', scrub: true },
        },
      )

      gsap.fromTo(
        '.m-photo',
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.m-photo', start: 'top 92%', once: true },
        },
      )
      gsap.fromTo(
        '.m-photo img',
        { scale: 1.2 },
        { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.m-photo', start: 'top 92%', once: true } },
      )
    }, el)
    return () => {
      ctx.revert()
      // StrictMode: не оставлять следов transform между двумя прогонами эффекта
      gsap.set(el.querySelectorAll('.m-line-in'), { clearProps: 'transform,fontStretch,fontWeight' })
    }
  }, [])

  return (
    <section
      id="manifest"
      ref={root}
      className="relative bg-bone text-ink"
      style={{ paddingBlock: 'var(--space-section)' }}
    >
      <div
        className="mx-auto grid min-h-[calc(100svh-var(--space-section))] w-full grid-cols-4 content-between gap-x-[var(--col-gap)] gap-y-[var(--space-block)] px-[var(--gutter-x)] md:grid-cols-8 xl:grid-cols-12"
      >
        {/* заголовок: с 5-й колонки (desktop) */}
        <h2
          className="m-title t-lg col-span-4 md:col-span-6 md:col-start-3 xl:col-span-8 xl:col-start-5"
          style={{ fontSize: 'clamp(44px, 12.5vw, 104px)' }}
        >
          {lines.map((line, i) => (
            <span key={line} className="block [clip-path:inset(0_-50vw)]">
              <span className="m-line-in relative block">
                {i === last ? (
                  <span className="relative inline-block">
                    <span className="text-ink/50">
                      {line}
                      <span className="text-ember">.</span>
                    </span>
                    <span aria-hidden className="m-fill absolute inset-0 block text-ink">
                      {line}
                      <span className="text-ember">.</span>
                    </span>
                  </span>
                ) : (
                  line
                )}
              </span>
            </span>
          ))}
        </h2>

        {/* низ: фото слева, текст справа */}
        <div className="col-span-4 grid grid-cols-subgrid items-end gap-y-[var(--space-block)] md:col-span-8 xl:col-span-12">
          <div className="m-photo col-span-3 w-[min(240px,60vw)] overflow-hidden rounded-[20px] md:col-span-3 xl:col-span-2 xl:col-start-2">
            <img
              src={assetUrl(photo.src)}
              alt={manifest.photoAlt}
              loading="lazy"
              decoding="async"
              width={853}
              height={853}
              className="block aspect-square w-full object-cover grayscale contrast-110"
            />
          </div>

          <div className="col-span-4 flex max-w-[60ch] flex-col gap-[var(--space-tight)] md:col-span-4 md:col-start-5 xl:col-span-4 xl:col-start-9">
            <p className="t-body">{bio.short}</p>
            <ul className="t-micro m-0 list-none p-0">
              {artist.highlights.map((h) => (
                <li key={h} className="border-t border-ink/25 py-3 first:border-t-ink/40">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
