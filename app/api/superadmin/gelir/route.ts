import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const source = searchParams.get('source')
  const month = searchParams.get('month') // YYYY-MM
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: Record<string, unknown> = {}
  if (source) where.source = source
  if (month) {
    const [y, m] = month.split('-').map(Number)
    where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59, 999) }
  } else if (startDate || endDate) {
    where.date = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
    }
  }

  const [rows, agg] = await Promise.all([
    prisma.income.findMany({ where, orderBy: { date: 'desc' } }),
    prisma.income.aggregate({ _sum: { amount: true }, where }),
  ])

  return NextResponse.json({ incomes: rows, total: agg._sum.amount ?? 0 })
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    source: string; amount: number; currency?: string; description?: string; date?: string
  }

  if (!body.source || !body.amount) {
    return NextResponse.json({ error: 'source ve amount zorunlu' }, { status: 400 })
  }

  const income = await prisma.income.create({
    data: {
      source: body.source,
      amount: Number(body.amount),
      currency: body.currency ?? 'USD',
      description: body.description ?? null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  })

  return NextResponse.json(income, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    id: string; source?: string; amount?: number; currency?: string; description?: string; date?: string
  }

  if (!body.id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  const income = await prisma.income.update({
    where: { id: body.id },
    data: {
      ...(body.source !== undefined ? { source: body.source } : {}),
      ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
    },
  })

  return NextResponse.json(income)
}

export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  await prisma.income.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
