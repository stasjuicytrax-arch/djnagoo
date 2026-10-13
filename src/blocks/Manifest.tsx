import { useLayoutEffect, useRef } from 'react'
import { content, assetUrl } from '@/lib/content'
import { gsap, reducedMotion } from '@/lib/smooth'

const { manifest, bio, artist, press } = content
const photo = press.find((p) => p.src.includes('press-03'))!

/**
 * 02 · Manifest: светлая пауза (--bone). Заголовок с 5-й колонки (SEKO), крупное вертикальное
 * ч/б фото в колонках 1–4 (на mobile 4:5 между заголовком и текстом).
 * Строки: line-mask + морфинг ширины 125→62. Последняя строка «бледная» (ink 50%: 30% из DESIGN
 * не проходит AA 3:1 на bone) и дозаливается скроллом. Фото: маска снизу вверх + параллакс.
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

      // фото: маска снизу вверх
      gsap.fromTo(
        '.m-photo',
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.3,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.m-photo', start: 'top 88%', once: true },
        },
      )
      // параллакс: кадр внутри рамки едет медленнее текста
      gsap.fromTo(
        '.m-photo img',
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }, el)
    return () => {
      ctx.revert()
      // StrictMode: не оставлять следов transform между двумя прогонами эффекта
      gsap.set(el.querySelectorAll('.m-line-in, .m-photo img'), { clearProps: 'transform,fontStretch,fontWeight' })
    }
  }, [])

  return (
    <section
      id="manifest"
      ref={root}
      className="relative bg-bone text-ink"
      style={{ paddingBlock: 'var(--space-section)' }}
    >
      <div className="mx-auto grid w-full grid-cols-4 gap-x-[var(--col-gap)] gap-y-[var(--space-block)] px-[var(--gutter-x)] md:grid-cols-8 xl:grid-cols-12">
        {/* заголовок: с 5-й колонки (desktop) */}
        <h2 className="m-title t-xl m-title-size col-span-4 md:col-span-5 md:col-start-4 md:row-start-1 xl:col-span-8 xl:col-start-5">
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

        {/* фото: колонки 1–4 на всю высоту блока, на mobile 4:5 */}
        <div className="m-photo col-span-4 aspect-[4/5] overflow-hidden rounded-[20px] md:col-span-3 md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto md:h-[min(80svh,900px)] xl:col-span-4 ring-1 ring-ink/15">
          <img
            src={assetUrl(photo.src)}
            alt={manifest.photoAlt}
            loading="lazy"
            decoding="async"
            width={1066}
            height={1600}
            className="-mt-[10%] block h-[120%] w-full max-w-none object-cover object-[50%_12%] grayscale contrast-110"
          />
        </div>

        <div
          data-avoid-cta
          className="col-span-4 flex max-w-[60ch] flex-col gap-[var(--space-tight)] md:col-span-5 md:col-start-4 md:row-start-2 md:self-end xl:col-span-4 xl:col-start-9"
        >
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
    </section>
  )
}
