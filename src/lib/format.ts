import { content, type TourItem } from '@/lib/content'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** DD.MM.YY, а если на афише числа нет, честно `FEB 2023` без выдуманного дня. */
export function fmtDate(it: TourItem): string {
  if (it.date) {
    const [y, m, d] = it.date.split('-')
    return `${d}.${m}.${y.slice(2)}`
  }
  const hint = (it as { monthHint?: string }).monthHint
  if (hint) {
    const [y, m] = hint.split('-')
    return `${MONTHS[Number(m) - 1]} ${y}`
  }
  return ''
}

/** Город афиши → группа папки (Juffair входит в Manama). */
export const groupOf = (it: TourItem) =>
  (content.tour.cityGroups as Record<string, string>)[it.city] ?? it.city
