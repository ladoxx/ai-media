import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const rows = await prisma.setting.findMany()
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    settings?: Record<string, string>
    changePassword?: string
  }

  if (body.changePassword) {
    const userId = (session.user as { id?: string }).id
    if (!userId) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 400 })
    const hashed = await bcrypt.hash(body.changePassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    return NextResponse.json({ success: true })
  }

  if (body.settings) {
    for (const [key, value] of Object.entries(body.settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
  }

  return NextResponse.json({ success: true })
}
