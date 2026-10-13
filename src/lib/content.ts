import raw from '@content/content.json'

export const content = raw
export type Content = typeof raw
export type TourItem = (typeof raw.tour.items)[number]

/** Пути в content.json вида `assets/...` лежат в /public; сайт живёт в подпапке, поэтому через BASE_URL. */
export const assetUrl = (p: string) => import.meta.env.BASE_URL + p.replace(/^\/+/, '')
