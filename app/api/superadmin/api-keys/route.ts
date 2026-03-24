import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt, maskValue } from '@/lib/crypto'

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  if ((session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

// ─── GET /api/superadmin/api-keys ─────────────────────────────────────────────
// Returns all ApiKey records with values masked.
export async function GET() {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  const keys = await prisma.apiKey.findMany({ orderBy: { name: 'asc' } })

  try {
    const result = keys.map(k => {
      const rawExists = !!k.value
      const decrypted = rawExists ? decrypt(k.value) : ''
      return {
        id: k.id,
        name: k.name,
        value: maskValue(decrypted),
        active: k.active,
        updatedAt: k.updatedAt,
        rawExists,
      }
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifre çözme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── PUT /api/superadmin/api-keys ─────────────────────────────────────────────
// Updates (upserts) a key value. Body: { name: string, value: string }
export async function PUT(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  let body: { name?: string; value?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { name, value } = body
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name zorunludur' }, { status: 400 })
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value zorunludur' }, { status: 400 })
  }

  let encryptedValue: string
  try {
    encryptedValue = encrypt(value)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifreleme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const apiKey = await prisma.apiKey.upsert({
    where: { name },
    update: {
      value: encryptedValue,
      active: value.trim() !== '',
      updatedAt: new Date(),
    },
    create: {
      name,
      value: encryptedValue,
      active: value.trim() !== '',
    },
  })

  // Log the action
  try {
    await prisma.autoLog.create({
      data: {
        type: 'API_KEY_UPDATE',
        status: 'success',
        message: `API anahtarı güncellendi: ${name} (kullanıcı: ${session.user?.email ?? 'bilinmiyor'})`,
      },
    })
  } catch {
    // Log failure should not fail the request
  }

  return NextResponse.json({ ok: true, id: apiKey.id, name: apiKey.name })
}

// ─── POST /api/superadmin/api-keys ────────────────────────────────────────────
// Creates or upserts a key. Body: { name: string, value: string }
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  let body: { name?: string; value?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { name, value } = body
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name zorunludur' }, { status: 400 })
  }
  if (typeof value !== 'string') {
    return NextResponse.json({ error: 'value zorunludur' }, { status: 400 })
  }

  let encryptedValue: string
  try {
    encryptedValue = encrypt(value)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifreleme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const apiKey = await prisma.apiKey.upsert({
    where: { name },
    update: {
      value: encryptedValue,
      active: value.trim() !== '',
      updatedAt: new Date(),
    },
    create: {
      name,
      value: encryptedValue,
      active: value.trim() !== '',
    },
  })

  try {
    await prisma.autoLog.create({
      data: {
        type: 'API_KEY_CREATE',
        status: 'success',
        message: `API anahtarı oluşturuldu: ${name}`,
      },
    })
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, id: apiKey.id, name: apiKey.name }, { status: 201 })
}

// ─── DELETE /api/superadmin/api-keys ─────────────────────────────────────────
// Deletes a key by name. Body: { name: string }
export async function DELETE(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  let body: { name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { name } = body
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name zorunludur' }, { status: 400 })
  }

  const existing = await prisma.apiKey.findUnique({ where: { name } })
  if (!existing) {
    return NextResponse.json({ error: 'Anahtar bulunamadı' }, { status: 404 })
  }

  await prisma.apiKey.delete({ where: { name } })

  try {
    await prisma.autoLog.create({
      data: {
        type: 'API_KEY_DELETE',
        status: 'success',
        message: `API anahtarı silindi: ${name}`,
      },
    })
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true })
}
