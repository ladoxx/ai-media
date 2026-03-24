import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateFlippaValue } from '@/lib/finance'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate ve endDate zorunlu' }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate + 'T23:59:59')

  const [incomes, expenses, topAffiliate] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: start, lte: end } }, orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ where: { date: { gte: start, lte: end } }, orderBy: { date: 'desc' } }),
    prisma.affiliateLink.findFirst({ orderBy: { clicks: 'desc' } }),
  ])

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalIncome - totalExpense

  // Income by source
  const bySource: Record<string, number> = {}
  for (const i of incomes) bySource[i.source] = (bySource[i.source] ?? 0) + i.amount
  const bestSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]

  // Duration in months for Flippa
  const months = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const avgMonthlyNet = netProfit / months
  const flippa = calculateFlippaValue(avgMonthlyNet)

  return NextResponse.json({
    period: { startDate, endDate },
    totalIncome,
    totalExpense,
    netProfit,
    bySource,
    bestSource: bestSource ? { source: bestSource[0], amount: bestSource[1] } : null,
    topAffiliate: topAffiliate ? { name: topAffiliate.name, clicks: topAffiliate.clicks } : null,
    flippa,
    incomes,
    expenses,
  })
}
