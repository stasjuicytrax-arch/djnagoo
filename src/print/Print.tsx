import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { content, assetUrl, type TourItem } from '@/lib/content'
import { fmtDate, groupOf } from '@/lib/format'
import { statValue } from '@/lib/stats'
import Logo from '@/components/Logo'

const { artist, manifest, bio, stats, genres, videos, timeline, tour, press, contacts, hero, ui, site } = content

/**
 * Маршрут /print (или ?print=1): каждая секция — слайд 1920×1080, всё в финальном состоянии,
 * видео заменены постерами с QR, WebGL — статичным градиентом. Экспорт: scripts/export-pdf.mjs.
 */
function Slide({
  id,
  className = '',
  style,
  children,
}: {
  id: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <section
      data-slide={id}
      style={style}
      className={`relative h-[1080px] w-[1920px] overflow-hidden break-after-page bg-ink text-bone ${className}`}
    >
      {children}
    </section>
  )
}

const H = ({ lines, dim }: { lines: string[]; dim?: boolean }) => (
  <h2 className={`t-xl m-0 ${dim ? '' : ''}`}>
    {lines.map((l, i) => (
      <span key={l} className="block">
        {l}
        {i === lines.length - 1 && <span className="text-ember">.</span>}
      </span>
    ))}
  </h2>
)

const Corner = ({ n }: { n: number }) => (
  <>
    <Logo className="absolute left-[56px] top-[44px] w-[110px]" />
    <p className="t-micro absolute bottom-[40px] right-[56px] tabular-nums">
      {String(n).padStart(2, '0')} / 09
    </p>
    <p className="t-micro absolute bottom-[40px] left-[56px]">
      {ui.live} {artist.base}
    </p>
  </>
)

function useQr(urls: string[]) {
  const [data, setData] = useState<string[]>([])
  useEffect(() => {
    let alive = true
    Promise.all(
      urls.map((u) => QRCode.toDataURL(u, { margin: 1, width: 300, color: { dark: '#0B0908', light: '#EDEAE4' } })),
    ).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [urls])
  return data
}

const ITEMS = [...tour.items].reverse()
const place = (it: TourItem) => [it.city, it.country].filter(Boolean).join(' · ')

export default function Print() {
  const videoUrls = useMemo(() => videos.map((v) => site.url + v.src), [])
  const qr = useQr(videoUrls)
  const photo = press.find((p) => p.src.includes('press-03'))!
  const press04 = press.find((p) => p.src.includes('press-04'))!
  const groups = useMemo(() => {
    const m = new Map<string, number>()
    tour.items.forEach((it) => m.set(groupOf(it), (m.get(groupOf(it)) ?? 0) + 1))
    return [...m.entries()]
  }, [])

  // дождаться шрифтов и картинок: Playwright читает window.__printReady
  useEffect(() => {
    const imgs = [...document.images]
    Promise.all([
      document.fonts.ready,
      ...imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => (i.onload = i.onerror = () => r(null))))),
    ]).then(() => ((window as unknown as { __printReady?: boolean }).__printReady = true))
  }, [qr.length])

  return (
    <main className="bg-ink">
      {/* 1 · Hero */}
      <Slide id="hero">
        <img src={assetUrl(hero.plate)} alt="" className="absolute inset-0 size-full object-cover" />
        <h1
          className="t-mega absolute inset-x-0 top-[130px] m-0 text-center text-bone"
          style={{ fontSize: '300px' }}
        >
          {artist.wordmark}
        </h1>
        <img
          src={assetUrl(hero.cutout!)}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ transform: 'scale(0.85)', transformOrigin: '50% 100%' }}
        />
        <ul className="t-micro absolute left-[56px] top-[410px] m-0 list-none p-0 leading-[1.8]">
          <li>{artist.role}</li>
          <li>Since {artist.since}</li>
          <li>{artist.base}</li>
        </ul>
        <p className="t-micro absolute right-[56px] top-[520px] text-ink [writing-mode:vertical-rl]">
          {artist.tagline}.
        </p>
        <Corner n={1} />
      </Slide>

      {/* 2 · Manifest */}
      <Slide id="manifest" className="!bg-bone !text-ink">
        <img
          src={assetUrl(photo.src)}
          alt=""
          className="absolute left-[56px] top-[110px] h-[860px] w-[640px] rounded-[20px] object-cover object-[50%_12%] grayscale contrast-110"
        />
        <h2 className="t-xl absolute left-[760px] top-[110px] m-0" style={{ fontSize: '170px' }}>
          {manifest.headline.map((l, i) => (
            <span key={l} className={`block ${i === 2 ? 'text-ink/50' : ''}`}>
              {l}
              {i === 2 && <span className="text-ember">.</span>}
            </span>
          ))}
        </h2>
        <div className="absolute bottom-[110px] left-[1280px] w-[580px]">
          <p className="t-body" style={{ fontSize: '19px' }}>{bio.short}</p>
          <ul className="t-micro m-0 mt-6 list-none p-0">
            {artist.highlights.map((h) => (
              <li key={h} className="border-t border-ink/30 py-3">{h}</li>
            ))}
          </ul>
        </div>
        <Logo className="absolute left-[56px] top-[44px] w-[110px] text-ink" />
        <p className="t-micro absolute bottom-[40px] right-[56px]">02 / 09</p>
      </Slide>

      {/* 3 · Stats */}
      <Slide
        id="stats"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--crimson), color-mix(in srgb, var(--red) 80%, var(--ink)) 40%, color-mix(in srgb, var(--ember) 62%, var(--ink)))',
        }}
      >
        <ul className="absolute inset-x-[56px] bottom-[230px] m-0 grid list-none grid-cols-4 gap-8 p-0">
          {stats.map((s) => {
            const n = statValue(s)
            return (
              <li key={s.label} className="border-t border-bone/50 pt-6">
                <span className="stat-num block" style={{ fontSize: '150px', lineHeight: 0.95 }}>{n}</span>
                <span className="t-micro mt-4 block">{s.label}</span>
              </li>
            )
          })}
        </ul>
        <Corner n={3} />
      </Slide>

      {/* 4 · Sound */}
      <Slide id="sound">
        <div className="absolute left-[56px] top-[150px]">
          <H lines={ui.titles.sound} />
          <p className="t-micro mt-6 text-bone-dim">
            {genres.length} {ui.genresCaption}
          </p>
        </div>
        <div className="absolute right-[120px] top-1/2 aspect-square w-[860px] -translate-y-1/2">
          {[1, 0.76, 0.52].map((d) => (
            <span
              key={d}
              className="absolute left-1/2 top-1/2 rounded-full border border-bone/20"
              style={{ width: `${d * 100}%`, height: `${d * 100}%`, transform: 'translate(-50%,-50%)' }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 size-[260px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-ember">
            <img src={assetUrl(press04.src)} alt="" className="size-full object-cover" />
          </div>
          {genres.map((g, i) => {
            const ring = i < 3 ? 0 : i < 6 ? 1 : 2
            const R = [0.5, 0.38, 0.26][ring] * 860
            const n = ring === 2 ? 2 : 3
            const k = ring === 0 ? i : ring === 1 ? i - 3 : i - 6
            const a = ((360 / n) * k + ring * 37 - 70) * (Math.PI / 180)
            return (
              <span
                key={g}
                className="t-micro absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-bone-faint bg-ink px-4 py-2"
                style={{ left: `calc(50% + ${Math.cos(a) * R}px)`, top: `calc(50% + ${Math.sin(a) * R}px)` }}
              >
                {g}
              </span>
            )
          })}
        </div>
        <Corner n={4} />
      </Slide>

      {/* 5 · Video: постеры + QR */}
      <Slide id="video">
        <div className="absolute left-[56px] top-[120px]">
          <H lines={ui.titles.video} />
        </div>
        <ul className="absolute inset-x-[56px] bottom-[130px] m-0 flex list-none items-end justify-end gap-8 p-0">
          {[videos[2], videos[0], videos[1]].map((v) => {
            const idx = videos.indexOf(v)
            const main = v.id === 'v01'
            return (
              <li key={v.id} className={`${main ? 'w-[520px]' : 'w-[340px]'} shrink-0`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-ink-2">
                  <img src={assetUrl(v.poster)} alt={v.caption} className={`size-full object-cover ${v.id === 'v03' ? 'grayscale' : ''}`} />
                  {qr[idx] && (
                    <img src={qr[idx]} alt="" className="absolute bottom-3 right-3 size-[104px] rounded-[12px]" />
                  )}
                </div>
                <p className="t-micro m-0 mt-3 text-bone-dim">{v.caption}</p>
              </li>
            )
          })}
        </ul>
        <Corner n={5} />
      </Slide>

      {/* 6 · Path */}
      <Slide id="timeline">
        <div className="absolute left-[56px] top-[110px]">
          <H lines={ui.titles.timeline} />
        </div>
        <div className="absolute inset-x-[56px] top-[610px] h-[2px]" style={{ backgroundImage: 'var(--grad-sunset)' }} />
        <ol className="absolute inset-x-[56px] top-0 m-0 h-full list-none p-0">
          {timeline.map((s, i) => {
            const award = s.kind === 'award'
            const to = s.to == null ? ui.timeline.now : s.to
            const up = i % 2 === 0
            return (
              <li
                key={`${s.from}-${i}`}
                className="absolute w-[190px]"
                style={{ left: i * (1808 / timeline.length), ...(up ? { bottom: 1080 - 610 + 34 } : { top: 610 + 34 }) }}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 size-3 rounded-full ${award ? 'bg-ember' : 'bg-bone-faint'}`}
                  style={up ? { bottom: -40 } : { top: -40 }}
                />
                <p className="t-micro m-0 text-bone-dim">{award || s.from === s.to ? s.from : `${(s as { rangeLabel?: string }).rangeLabel ?? s.from} – ${to}`}</p>
                <p className={`t-md-cond m-0 mt-2 ${award ? 'text-ember' : ''}`} style={{ fontSize: '28px' }}>{s.title}</p>
                <p className="t-micro m-0 mt-2 text-bone-dim">{[s.venue, s.place].filter(Boolean).join(' · ')}</p>
              </li>
            )
          })}
        </ol>
        <Corner n={6} />
      </Slide>

      {/* 7a · Tour: список */}
      <Slide id="tour-list">
        <div className="absolute left-[56px] top-[90px] flex items-end gap-10">
          <H lines={ui.titles.tour} />
          <p className="t-micro mb-2 text-bone-dim">
            {tour.items.length} {ui.tour.nights} · {groups.length} {ui.tour.cities}
          </p>
        </div>
        <ul className="absolute inset-x-[56px] bottom-[110px] m-0 grid list-none grid-cols-2 gap-x-14 p-0">
          {ITEMS.map((it) => (
            <li key={it.id} className="grid grid-cols-[110px_1fr_auto] items-baseline gap-4 border-t border-bone/25 py-[10px]">
              <span className="t-micro tabular-nums text-bone-dim">{fmtDate(it)}</span>
              <span className="t-md-cond truncate" style={{ fontSize: '22px' }}>{it.venue}</span>
              <span className="t-micro text-bone-dim">{place(it)}</span>
            </li>
          ))}
        </ul>
        <Corner n={7} />
      </Slide>

      {/* 7b · Tour: афиши */}
      <Slide id="tour-posters">
        <ul className="absolute inset-x-[56px] top-[110px] m-0 grid list-none grid-cols-8 gap-x-5 gap-y-10 p-0">
          {tour.items.map((it) => (
            <li key={it.id}>
              <img src={assetUrl(it.poster)} alt="" className="aspect-[3/4] w-full rounded-[12px] object-cover" />
              <p className="t-micro m-0 mt-2 tabular-nums text-bone-dim">{fmtDate(it)}</p>
            </li>
          ))}
        </ul>
        <Corner n={7} />
      </Slide>

      {/* 8 · Gallery: коллаж */}
      <Slide id="gallery">
        <ul className="absolute inset-0 m-0 grid list-none grid-cols-8 grid-rows-3 gap-3 p-6">
          {[...press.map((p) => p.src), ...tour.items.slice(0, 12).map((t) => t.poster), ...videos.map((v) => v.poster)]
            .slice(0, 24)
            .map((src, i) => (
              <li key={src + i} className="overflow-hidden rounded-[20px] bg-ink-2">
                <img src={assetUrl(src)} alt="" className="size-full object-cover" />
              </li>
            ))}
        </ul>
        <div className="absolute inset-0 grid place-items-center" style={{ background: 'radial-gradient(40% 36% at 50% 50%, rgba(11,9,8,.92), rgba(11,9,8,.55) 60%, transparent 85%)' }}>
          <div className="text-center">
            <H lines={ui.titles.gallery} />
          </div>
        </div>
        <Corner n={8} />
      </Slide>

      {/* 9 · Booking */}
      <Slide id="booking" style={{ backgroundImage: 'var(--grad-glow)' }}>
        <div className="absolute inset-x-0 top-[130px] text-center">
          <H lines={ui.titles.booking} />
        </div>
        <ul className="absolute left-1/2 top-[600px] m-0 w-[900px] -translate-x-1/2 list-none rounded-[20px] bg-ink/70 p-6">
          {[
            { l: `${ui.booking.call} / ${ui.booking.whatsapp}`, t: contacts.phone },
            { l: ui.booking.email, t: contacts.email },
            { l: 'Instagram', t: contacts.instagram.handle },
          ].map((r, i) => (
            <li key={r.l + i} className="flex items-baseline justify-between border-t border-bone/30 py-3 first:border-t-0">
              <span className="t-micro">{r.l}</span>
              <span className="t-md" style={{ fontSize: '30px' }}>{r.t}</span>
            </li>
          ))}
        </ul>
        <Corner n={9} />
      </Slide>
    </main>
  )
}
