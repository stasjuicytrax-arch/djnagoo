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
