import { useCallback, useState } from 'react'
import { content } from '@/lib/content'
import { useSmoothScroll } from '@/lib/smooth'
import { markIntroDone, shouldPreload } from '@/lib/intro'
import Frame from '@/components/Frame'
import Grain from '@/components/Grain'
import Cursor from '@/components/Cursor'
import FloatingCta from '@/components/FloatingCta'
import Preloader from '@/components/Preloader'
import Hero from '@/blocks/Hero'
import Manifest from '@/blocks/Manifest'
import Stats from '@/blocks/Stats'
import Sound from '@/blocks/Sound'
import Video from '@/blocks/Video'
import Timeline from '@/blocks/Timeline'
import Tour from '@/blocks/Tour'

export default function App() {
  useSmoothScroll()
  const [loading, setLoading] = useState(() => {
    const show = shouldPreload()
    if (!show) markIntroDone()
    return show
  })
  const onDone = useCallback(() => setLoading(false), [])

  return (
    <>
      <Frame />
      <FloatingCta />
      <Cursor />
      <Grain />
      {loading && <Preloader onDone={onDone} />}
      <main>
        <Hero />
        <Manifest />
        <Stats />
        <Sound />
        <Video />
        <Timeline />
        <Tour />
        {/* Временные заглушки: заменяются блоками 08–09 по порядку TZ §4 */}
        {content.ui.sections.slice(7).map((id) => (
          <section
            key={id}
            id={id}
            className={`grid min-h-svh place-items-center ${id === 'manifest' ? 'bg-bone text-ink' : ''}`}
          >
            <span className="t-lg">{id}</span>
          </section>
        ))}
      </main>
    </>
  )
}
