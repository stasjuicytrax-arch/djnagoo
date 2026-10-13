import { forwardRef, type CSSProperties } from 'react'

type Props = {
  /** CSS-цвет головки и хвоста, например `var(--ember)` */
  color: string
  /** длина хвоста в градусах дуги */
  tail?: number
  /** толщина хвоста по линии орбиты, px */
  width?: number
  /** движение против часовой стрелки: хвост уходит по часовой */
  ccw?: boolean
  /** стартовый угол, deg (для reduced-motion — статичная точка) */
  angle?: number
  className?: string
}

/**
 * Световая комета на круговой орбите (приём «Comet», DESIGN §7). Заполняет родителя: хвост — это
 * граница круга того же размера, маскированная conic-gradient (линейное затухание), головка — точка
 * 5px со свечением. Вращается внешним кодом: ref ведёт на вращающийся слой.
 * Свечение — box-shadow, без mix-blend-mode, чтобы не выжигать фото.
 */
const Comet = forwardRef<HTMLDivElement, Props>(function Comet(
  { color, tail = 75, width = 1.5, ccw = false, angle = 0, className = '' },
  ref,
) {
  const vars = { '--c': color, '--w': `${width}px`, '--tail': `${tail}deg` } as CSSProperties
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={vars}>
      <div ref={ref} className="absolute inset-0 will-change-transform" style={{ transform: `rotate(${angle}deg)` }}>
        <span className={`comet-tail comet-tail-soft ${ccw ? 'is-ccw' : ''}`} />
        <span className={`comet-tail ${ccw ? 'is-ccw' : ''}`} />
        <span className="comet-head" />
      </div>
    </div>
  )
})

export default Comet
