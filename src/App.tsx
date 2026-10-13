import { content } from '@/lib/content'
import { useSmoothScroll } from '@/lib/smooth'
import Frame from '@/components/Frame'
import Grain from '@/components/Grain'
import Cursor from '@/components/Cursor'
import FloatingCta from '@/components/FloatingCta'

export default function App() {
  useSmoothScroll()

  return (
    <>
      <Frame />
      <FloatingCta />
      <Cursor />
      <Grain />
      <main>
        {/* Временные заглушки: заменяются блоками 01–09 по порядку TZ §4 */}
        {content.ui.sections.map((id) => (
          <section key={id} id={id} className="grid min-h-svh place-items-center">
            <span className="t-lg">{id}</span>
          </section>
        ))}
      </main>
    </>
  )
}
