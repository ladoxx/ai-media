import { prisma } from './db'
import { unstable_cache } from 'next/cache'

export type WidgetRecord = {
  id: string
  name: string
  slug: string
  area: string
  type: string
  settings: string
  order: number
  active: boolean
}

export const WIDGET_AREAS = ['sidebar', 'footer-1', 'footer-2', 'header'] as const
export type WidgetArea = typeof WIDGET_AREAS[number]

export const WIDGET_TYPES = [
  { type: 'recent-posts',  name: 'Son Yazılar',        icon: '📰' },
  { type: 'live-prices',   name: 'Canlı Fiyatlar',     icon: '💰' },
  { type: 'newsletter',    name: 'Newsletter Formu',    icon: '📬' },
  { type: 'trending',      name: 'Trend Haberler',      icon: '🔥' },
  { type: 'tag-cloud',     name: 'Etiket Bulutu',       icon: '🏷️' },
  { type: 'categories',    name: 'Kategoriler',         icon: '📊' },
  { type: 'search',        name: 'Arama Kutusu',        icon: '🔍' },
  { type: 'ad',            name: 'Reklam Alanı',        icon: '📢' },
  { type: 'custom-html',   name: 'Özel HTML/Kod',       icon: '✏️' },
] as const

export const getWidgetsByArea = (area: string) =>
  unstable_cache(
    async (): Promise<WidgetRecord[]> => {
      return prisma.widget.findMany({
        where: { area, active: true },
        orderBy: { order: 'asc' },
      })
    },
    [`widgets-${area}`],
    { revalidate: 300, tags: ['widgets', `widgets-${area}`] }
  )()
