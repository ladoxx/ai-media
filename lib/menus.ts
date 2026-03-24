import { unstable_cache } from 'next/cache'
import { prisma } from './db'

export type MenuItemData = {
  id: string
  label: string
  url: string
  type: string
  target: string
  icon: string | null
  order: number
  parentId: string | null
  children: MenuItemData[]
}

export type MenuData = {
  id: string
  name: string
  slug: string
  location: string
  items: MenuItemData[]
}

function buildTree(items: any[], parentId: string | null = null): MenuItemData[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      label: item.label,
      url: item.url,
      type: item.type,
      target: item.target,
      icon: item.icon,
      order: item.order,
      parentId: item.parentId,
      children: buildTree(items, item.id),
    }))
}

export function getMenu(location: string): Promise<MenuItemData[]> {
  return unstable_cache(
    async () => {
      const menu = await prisma.menu.findFirst({
        where: { location },
        include: { items: { orderBy: { order: 'asc' } } },
      })
      if (!menu) return []
      return buildTree(menu.items)
    },
    [`menu-${location}`],
    { revalidate: 3600, tags: ['menus'] }
  )()
}

export async function getMenuFresh(location: string): Promise<MenuItemData[]> {
  const menu = await prisma.menu.findFirst({
    where: { location },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  if (!menu) return []
  return buildTree(menu.items)
}
