import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { systemRole?: string; role?: string; id?: string } | undefined
  if (!session || (user?.systemRole !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN')) return null
  return session
}

// POST /api/superadmin/api-keys/dogrula
// Body: { password: string }
// Response: { token: string, expiresAt: string }
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const userId = (session.user as { id?: string }).id!
  const { password } = await req.json() as { password?: string }

  if (!password) {
    return NextResponse.json({ error: 'Şifre zorunludur' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
  }

  // 10 dakikalık token oluştur
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.superAdminToken.upsert({
    where: { userId },
    update: { tokenHash, expiresAt },
    create: { userId, tokenHash, expiresAt },
  })

  return NextResponse.json({ token: rawToken, expiresAt: expiresAt.toISOString() })
}

// GET /api/superadmin/api-keys/dogrula?token=...
// Token geçerliliğini kontrol eder
export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ valid: false }, { status: 403 })

  const userId = (session.user as { id?: string }).id!
  const rawToken = req.nextUrl.searchParams.get('token')
  if (!rawToken) return NextResponse.json({ valid: false })

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const record = await prisma.superAdminToken.findFirst({
    where: { userId, tokenHash, expiresAt: { gt: new Date() } },
  })

  return NextResponse.json({ valid: !!record })
}
