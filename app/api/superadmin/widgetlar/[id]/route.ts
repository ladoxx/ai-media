import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if ('name' in body) data.name = body.name
  if ('active' in body) data.active = body.active
  if ('order' in body) data.order = body.order
  if ('settings' in body) data.settings = JSON.stringify(body.settings)

  const widget = await prisma.widget.update({ where: { id }, data })
  revalidatePath('/', 'layout')
  return NextResponse.json(widget)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const { id } = await params
  const widget = await prisma.widget.delete({ where: { id } })
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
