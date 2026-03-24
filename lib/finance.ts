import { prisma } from '@/lib/db'

export interface MonthStats {
  year: number
  month: number
  label: string
  income: number
  expense: number
  net: number
}

export interface SummaryResult {
  thisMonth: { income: number; expense: number; net: number }
  lastMonth: { income: number; expense: number; net: number }
  bySource: Record<string, number>
  monthly: MonthStats[]
  flippa: { low: number; mid: number; high: number; monthsOfData: number }
  annualProjection: number
}

function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })
}

function startOf(year: number, month: number): Date {
  return new Date(year, month - 1, 1)
}
function endOf(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999)
}

export async function calculateMonthlyStats(month: number, year: number): Promise<MonthStats> {
  const start = startOf(year, month)
  const end = endOf(year, month)

  const [incomes, expenses] = await Promise.all([
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
  ])

  const income = incomes._sum.amount ?? 0
  const expense = expenses._sum.amount ?? 0

  return { year, month, label: monthLabel(year, month), income, expense, net: income - expense }
}

export async function generateMonthlySummary(monthsBack = 6): Promise<MonthStats[]> {
  const now = new Date()
  const results: MonthStats[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    results.push(await calculateMonthlyStats(d.getMonth() + 1, d.getFullYear()))
  }

  return results
}

export function calculateFlippaValue(avgMonthlyNet: number) {
  return {
    low: Math.round(avgMonthlyNet * 25),
    mid: Math.round(avgMonthlyNet * 35),
    high: Math.round(avgMonthlyNet * 45),
  }
}

export async function getFinanceSummary(): Promise<SummaryResult> {
  const now = new Date()
  const thisM = now.getMonth() + 1
  const thisY = now.getFullYear()
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastM = lastDate.getMonth() + 1
  const lastY = lastDate.getFullYear()

  const [thisMonth, lastMonth, monthly] = await Promise.all([
    calculateMonthlyStats(thisM, thisY),
    calculateMonthlyStats(lastM, lastY),
    generateMonthlySummary(6),
  ])

  // Income by source (this month)
  const incomeRows = await prisma.income.groupBy({
    by: ['source'],
    _sum: { amount: true },
    where: { date: { gte: startOf(thisY, thisM), lte: endOf(thisY, thisM) } },
  })
  const bySource: Record<string, number> = {}
  for (const r of incomeRows) bySource[r.source] = r._sum.amount ?? 0

  // Flippa: avg net over available months
  const netsWithData = monthly.filter((m) => m.income > 0 || m.expense > 0)
  const avgNet = netsWithData.length > 0
    ? netsWithData.reduce((s, m) => s + m.net, 0) / netsWithData.length
    : 0
  const flippa = calculateFlippaValue(avgNet)

  return {
    thisMonth: { income: thisMonth.income, expense: thisMonth.expense, net: thisMonth.net },
    lastMonth: { income: lastMonth.income, expense: lastMonth.expense, net: lastMonth.net },
    bySource,
    monthly,
    flippa: { ...flippa, monthsOfData: netsWithData.length },
    annualProjection: thisMonth.income * 12,
  }
}
