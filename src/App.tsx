import { useCallback, useEffect, useState } from 'react'
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
import Lazy from '@/components/Lazy'

const loadSound = () => import('@/blocks/Sound')
const loadVideo = () => import('@/blocks/Video')
const loadTimeline = () => import('@/blocks/Timeline')
const loadTour = () => import('@/blocks/Tour')
const loadGallery = () => import('@/blocks/Gallery')
const loadBooking = () => import('@/blocks/Booking')

export default function App() {
  useSmoothScroll()
  const [loading, setLoading] = useState(() => {
    const show = shouldPreload()
    if (!show) markIntroDone()
    return show
  })
  const onDone = useCallback(() => setLoading(false), [])

  // в простое после первой отрисовки докачиваем чанки блоков, не блокируя главный поток
  useEffect(() => {
    const run = () => [loadSound, loadVideo, loadTimeline, loadTour, loadGallery, loadBooking].forEach((l) => void l())
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    let t = 0
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(run, { timeout: 4000 })
    else t = window.setTimeout(run, 2500)
    return () => window.clearTimeout(t)
  }, [])

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
        <Lazy id="sound" load={loadSound} minHeight="100svh" />
        <Lazy id="video" load={loadVideo} minHeight="100svh" />
        <Lazy id="timeline" load={loadTimeline} minHeight="100svh" />
        <Lazy id="tour" load={loadTour} minHeight="100svh" />
        <Lazy id="gallery" load={loadGallery} minHeight="100svh" />
        <Lazy id="booking" load={loadBooking} minHeight="100svh" />
      </main>
    </>
  )
}
