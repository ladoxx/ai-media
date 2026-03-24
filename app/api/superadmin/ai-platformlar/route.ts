import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt, maskValue } from '@/lib/crypto'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const platforms = await prisma.aiPlatform.findMany({ orderBy: { createdAt: 'asc' } })

  try {
    const result = platforms.map((p) => ({
      ...p,
      apiKey: maskValue(decrypt(p.apiKey)),
    }))
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifre çözme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    name: string; slug: string; apiKey: string; model: string
    baseUrl?: string; monthlyLimit?: number; active?: boolean
  }

  if (!body.slug || !body.apiKey || !body.model) {
    return NextResponse.json({ error: 'slug, apiKey ve model zorunlu' }, { status: 400 })
  }

  let encryptedKey: string
  try {
    encryptedKey = encrypt(body.apiKey)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifreleme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const platform = await prisma.aiPlatform.create({
    data: {
      name: body.name || body.slug,
      slug: body.slug,
      apiKey: encryptedKey,
      model: body.model,
      baseUrl: body.baseUrl || null,
      monthlyLimit: body.monthlyLimit || null,
      active: body.active ?? false,
    },
  })

  return NextResponse.json({ ...platform, apiKey: maskValue(body.apiKey) }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    id: string; apiKey?: string; model?: string; baseUrl?: string
    active?: boolean; monthlyLimit?: number; name?: string
  }

  if (!body.id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  let updatedEncryptedKey: string | undefined
  if (body.apiKey !== undefined) {
    try {
      updatedEncryptedKey = encrypt(body.apiKey)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifreleme hatası'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  const platform = await prisma.aiPlatform.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(updatedEncryptedKey !== undefined ? { apiKey: updatedEncryptedKey } : {}),
      ...(body.model !== undefined ? { model: body.model } : {}),
      ...(body.baseUrl !== undefined ? { baseUrl: body.baseUrl || null } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.monthlyLimit !== undefined ? { monthlyLimit: body.monthlyLimit || null } : {}),
    },
  })

  try {
    return NextResponse.json({ ...platform, apiKey: maskValue(decrypt(platform.apiKey)) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Şifre çözme hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  // Delete logs first
  await prisma.aiLog.deleteMany({ where: { platformId: id } })
  await prisma.aiPlatform.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
