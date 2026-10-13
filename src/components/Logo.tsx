/** Вордмарк DJNAGOO. Контур из logo.svg (potrace), цвет через currentColor. */
import raw from '../../public/assets/logo/logo.svg?raw'

const d = /\sd="([^"]+)"/.exec(raw)?.[1] ?? ''

export default function Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 4460 596"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={d} />
    </svg>
  )
}
