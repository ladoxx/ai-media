import { prisma } from './db'
import { PLUGIN_REGISTRY, getPlugin } from './plugin-defs'
import { unstable_cache } from 'next/cache'

export { PLUGIN_REGISTRY, getPlugin }

// Ensure all plugins exist in DB (upsert with default inactive state)
export async function syncPluginsToDB() {
  for (const p of PLUGIN_REGISTRY) {
    await prisma.plugin.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, version: p.version },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        version: p.version,
        author: p.author ?? 'Cyba',
        active: ['adsense', 'analytics', 'crypto-ticker', 'cookie-consent', 'social-share', 'telegram-share', 'related-posts'].includes(p.slug),
      },
    })
  }
}

export type ActivePlugin = {
  slug: string
  headCode: string
  bodyStartCode: string
  bodyEndCode: string
}

export const getActivePluginCodes = unstable_cache(
  async (): Promise<ActivePlugin[]> => {
    const dbPlugins = await prisma.plugin.findMany({ where: { active: true } })
    return dbPlugins.flatMap((dbp) => {
      const def = getPlugin(dbp.slug)
      if (!def) return []
      const settings: Record<string, string> = JSON.parse(dbp.settings || '{}')
      return [{
        slug: dbp.slug,
        headCode: def.getHeadCode(settings),
        bodyStartCode: def.getBodyStartCode(settings),
        bodyEndCode: def.getBodyEndCode(settings),
      }]
    })
  },
  ['active-plugins'],
  { revalidate: 3600, tags: ['plugins'] }
)
