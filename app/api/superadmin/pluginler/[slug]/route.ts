import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

interface Params { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { slug } = await params
  const plugin = await prisma.plugin.findUnique({ where: { slug } })
  return NextResponse.json({ settings: plugin?.settings ?? '{}' })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { slug } = await params
  const { settings } = await req.json()

  await prisma.plugin.upsert({
    where: { slug },
    update: { settings: JSON.stringify(settings) },
    create: { slug, name: slug, description: '', settings: JSON.stringify(settings) },
  })

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
