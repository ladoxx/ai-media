import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

function forbidden() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
}

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { systemRole?: string; role?: string } | undefined
  if (!session || (u?.systemRole !== 'SUPERADMIN' && u?.role !== 'SUPERADMIN')) return null
  return session
}

export async function GET() {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const users = await prisma.user.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Don't expose password hashes
  const safe = users.map(({ password: _pw, ...u }) => u)
  return NextResponse.json(safe)
}

export async function POST(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const body = await req.json()
  const { name, email, password, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Ad, email ve şifre zorunludur' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Bu email zaten kullanımda' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  const validRole = ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(role) ? role : 'EDITOR'
  // Yeni kullanıcılar SuperAdmin onayına kadar pasif
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      systemRole: validRole as 'SUPERADMIN' | 'ADMIN' | 'EDITOR',
      active: validRole === 'SUPERADMIN', // superadmin otomatik aktif
    },
  })

  await prisma.autoLog.create({
    data: {
      type: 'user',
      status: 'success',
      message: `Yeni kullanıcı oluşturuldu: ${email} (${user.systemRole})`,
    },
  })

  const { password: _pw, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const body = await req.json()
  const { id, name, email, role, newPassword } = body

  if (!id) {
    return NextResponse.json({ error: 'ID zorunludur' }, { status: 400 })
  }

  const updateData: any = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  if (role && ['SUPERADMIN', 'ADMIN', 'EDITOR'].includes(role)) {
    updateData.systemRole = role
  }
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    const { password: _pw, ...safe } = user
    return NextResponse.json(safe)
  } catch {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await checkSuperAdmin()
  if (!session) return forbidden()

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID zorunludur' }, { status: 400 })
  }

  // Prevent self-deletion
  const currentId = (session.user as any).id
  if (id === currentId) {
    return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    })
    if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

    // If the user owns posts we cannot delete (authorId is non-nullable).
    // Find or create a "ghost" SUPERADMIN to reassign posts, or just block deletion.
    if ((user as any)._count.posts > 0) {
      // Try to find another superadmin to reassign posts to
      const fallback = await prisma.user.findFirst({
        where: { systemRole: 'SUPERADMIN', id: { not: id } },
        orderBy: { createdAt: 'asc' },
      })

      if (!fallback) {
        return NextResponse.json(
          { error: `Bu kullanıcının ${(user as any)._count.posts} yazısı var ve atanabileceği başka bir SuperAdmin bulunamadı.` },
          { status: 400 }
        )
      }

      // Reassign all posts to fallback user
      await prisma.post.updateMany({
        where: { authorId: id },
        data: { authorId: fallback.id },
      })
    }

    await prisma.user.delete({ where: { id } })

    await prisma.autoLog.create({
      data: {
        type: 'user',
        status: 'success',
        message: `Kullanıcı silindi: ${user.email}`,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Silme işlemi başarısız' }, { status: 500 })
  }
}
