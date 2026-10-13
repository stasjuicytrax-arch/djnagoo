import { useEffect, useState } from 'react'
import { content } from '@/lib/content'

const ids = content.ui.sections

/**
 * Индекс секции под центром вьюпорта. Блоки ниже Manifest монтируются лениво и заменяют заглушку
 * другим DOM-узлом, поэтому наблюдатель пересоздаётся по событию `nagoo:sections`.
 */
export function useActiveSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let io: IntersectionObserver | null = null
    const observe = () => {
      io?.disconnect()
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setIndex(ids.indexOf(e.target.id))
          }
        },
        { rootMargin: '-50% 0px -50% 0px' },
      )
      ids.forEach((id) => {
        const el = document.getElementById(id)
        if (el) io!.observe(el)
      })
    }
    observe()
    window.addEventListener('nagoo:sections', observe)
    return () => {
      io?.disconnect()
      window.removeEventListener('nagoo:sections', observe)
    }
  }, [])

  return index
}
