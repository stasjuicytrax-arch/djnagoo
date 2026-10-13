import { content } from '@/lib/content'

const { stats, playedIn } = content
export type Stat = (typeof stats)[number]

export const COUNTRY_COUNT = playedIn.countries.length
/** Города: все города стран плюс города без страны на афише (Sevastopol). */
export const CITY_COUNT = playedIn.countries.reduce((n, c) => n + c.cities.length, 0) + playedIn.cityOnly.length

/** Значения берутся из данных: стаж от текущего года, страны и города из playedIn. */
export function statValue(s: Stat): number {
  const f = (s as { format?: string }).format
  const v = (s as { value?: number }).value ?? 0
  if (f === 'yearsSince') return new Date().getFullYear() - v
  if (f === 'playedCountries') return COUNTRY_COUNT
  if (f === 'playedCities') return CITY_COUNT
  return v
}

/** Строка фактов для Manifest и /print: «21 YEARS · 4 RESIDENCIES · 5 COUNTRIES · 10 CITIES». */
export function factsLine(): string {
  return stats.map((s) => `${statValue(s)} ${s.label}`).join(' · ')
}
