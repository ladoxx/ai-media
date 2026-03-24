import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const CODE_KEYS = ['custom_head_code', 'custom_body_start_code', 'custom_body_end_code']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const rows = await prisma.setting.findMany({ where: { key: { in: CODE_KEYS } } })
  const data = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'SUPERADMIN') return NextResponse.json({}, { status: 403 })

  const body = await req.json()

  await Promise.all(
    CODE_KEYS.map((key) => {
      if (!(key in body)) return null
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]) },
      })
    }).filter(Boolean)
  )

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true })
}
