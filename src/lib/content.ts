import raw from '@content/content.json'

export const content = raw
export type Content = typeof raw
export type TourItem = (typeof raw.tour.items)[number]

/** Пути в content.json вида `assets/...` отдаются из /public. */
export const assetUrl = (p: string) => `/${p}`
