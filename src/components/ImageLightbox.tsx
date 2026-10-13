import { useCallback, useEffect, useRef } from 'react'
import { content } from '@/lib/content'
import { getLenis } from '@/lib/smooth'

const L = content.ui.lightbox

export type LightboxItem = { src: string; caption: string }

const X = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
)
const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" className={flip ? 'rotate-180' : ''}>
    <path d="M1 7h12M8 2l5 5-5 5" />
  </svg>
)

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const { label, className = '', children, ...rest } = props
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`grid size-11 place-items-center rounded-full bg-ink/80 text-bone transition-colors hover:bg-ember hover:text-ink ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Лайтбокс-слайдер на <dialog>: фокус-ловушка и Esc от браузера, стрелки и свайп вручную.
 * index === null — закрыт. Используется в Tour (афиши) и Gallery.
 */
export default function ImageLightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: LightboxItem[]
  index: number | null
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const dlg = useRef<HTMLDialogElement>(null)
  const start = useRef<number | null>(null)
  const open = index !== null

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
    // страница под модалкой не должна листаться колесом
    if (open) getLenis()?.stop()
    return () => getLenis()?.start()
  }, [open])

  const go = useCallback(
    (d: number) => {
      if (index === null) return
      onIndex((index + d + items.length) % items.length)
    },
    [index, items.length, onIndex],
  )

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, go])

  const item = index !== null ? items[index] : null

  return (
    <dialog
      ref={dlg}
      onClose={onClose}
      onClick={(e) => e.target === dlg.current && onClose()}
      aria-label={item?.caption ?? ''}
      className="m-auto h-svh max-h-none w-screen max-w-none bg-ink/95 p-0 text-bone backdrop:bg-ink"
    >
      {item && (
        <div
          className="grid h-full w-full touch-pan-y place-items-center p-4"
          onPointerDown={(e) => (start.current = e.clientX)}
          onPointerCancel={() => (start.current = null)}
          onPointerUp={(e) => {
            if (start.current === null) return
            const dx = e.clientX - start.current
            start.current = null
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
          }}
        >
          <figure className="m-0 flex max-h-full max-w-full flex-col items-center gap-3">
            <img
              src={item.src}
              alt={item.caption}
              draggable={false}
              className="max-h-[82svh] max-w-full rounded-[20px] object-contain"
            />
            <figcaption className="t-micro text-center text-bone-dim">
              {item.caption}
              <span className="ml-3 tabular-nums">
                {(index ?? 0) + 1} {L.of} {items.length}
              </span>
            </figcaption>
          </figure>
          <Btn label={L.close} onClick={onClose} className="absolute right-4 top-4">
            {X}
          </Btn>
          {items.length > 1 && (
            <>
              <Btn label={L.prev} onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2">
                <Arrow flip />
              </Btn>
              <Btn label={L.next} onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2">
                <Arrow />
              </Btn>
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
