import { useEffect, useState } from 'react'
import { content } from '@/lib/content'

const ids = content.ui.sections

/** Индекс секции под центром вьюпорта (по [data-section]). -1 — до первой. */
export function useActiveSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setIndex(ids.indexOf(e.target.id))
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return index
}
