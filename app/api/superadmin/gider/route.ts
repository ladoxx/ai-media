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
  const category = searchParams.get('category')
  const month = searchParams.get('month')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const recurring = searchParams.get('recurring')

  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (recurring === 'true') where.recurring = true
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
    prisma.expense.findMany({ where, orderBy: { date: 'desc' } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where }),
  ])

  return NextResponse.json({ expenses: rows, total: agg._sum.amount ?? 0 })
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    category: string; description: string; amount: number
    currency?: string; recurring?: boolean; date?: string
  }

  if (!body.category || !body.description || !body.amount) {
    return NextResponse.json({ error: 'category, description ve amount zorunlu' }, { status: 400 })
  }

  const expense = await prisma.expense.create({
    data: {
      category: body.category,
      description: body.description,
      amount: Number(body.amount),
      currency: body.currency ?? 'USD',
      recurring: body.recurring ?? false,
      date: body.date ? new Date(body.date) : new Date(),
    },
  })

  return NextResponse.json(expense, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as {
    id: string; category?: string; description?: string; amount?: number
    currency?: string; recurring?: boolean; date?: string
  }

  if (!body.id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  const expense = await prisma.expense.update({
    where: { id: body.id },
    data: {
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.recurring !== undefined ? { recurring: body.recurring } : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
    },
  })

  return NextResponse.json(expense)
}

export async function DELETE(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 })

  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
