import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { syncPluginsToDB, PLUGIN_REGISTRY } from '@/lib/plugins'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  await syncPluginsToDB()

  const dbPlugins = await prisma.plugin.findMany()
  const pluginMap = Object.fromEntries(dbPlugins.map((p) => [p.slug, p]))

  const plugins = PLUGIN_REGISTRY.map((def) => {
    const db = pluginMap[def.slug]
    return {
      slug: def.slug,
      name: def.name,
      description: def.description,
      version: def.version,
      icon: def.icon,
      active: db?.active ?? false,
      settings: db?.settings ?? '{}',
    }
  })

  return NextResponse.json(plugins)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { slug, active } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug gerekli' }, { status: 400 })

  await prisma.plugin.upsert({
    where: { slug },
    update: { active },
    create: { slug, name: slug, description: '', active },
  })

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
