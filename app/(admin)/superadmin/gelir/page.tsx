'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts'
import { Loader2, Plus, Pencil, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ozet' | 'gelirler' | 'giderler' | 'affiliate' | 'raporlar'

interface Summary {
  thisMonth: { income: number; expense: number; net: number }
  lastMonth: { income: number; expense: number; net: number }
  bySource: Record<string, number>
  monthly: Array<{ year: number; month: number; label: string; income: number; expense: number; net: number }>
  flippa: { low: number; mid: number; high: number; monthsOfData: number }
  annualProjection: number
}

interface Income {
  id: string; source: string; amount: number; currency: string
  description: string | null; date: string; createdAt: string
}

interface Expense {
  id: string; category: string; amount: number; currency: string
  description: string; recurring: boolean; date: string; createdAt: string
}

interface AffLink {
  id: string; name: string; slug: string; url: string; keywords: string
  commission: number; clicks: number; clicksThisMonth: number; active: boolean
}

interface Report {
  period: { startDate: string; endDate: string }
  totalIncome: number; totalExpense: number; netProfit: number
  bySource: Record<string, number>
  bestSource: { source: string; amount: number } | null
  topAffiliate: { name: string; clicks: number } | null
  flippa: { low: number; mid: number; high: number }
  incomes: Income[]; expenses: Expense[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#f7931a]'
const BTN_BASE = 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors'

const SOURCE_LABELS: Record<string, string> = {
  adsense: 'AdSense', affiliate: 'Affiliate', sponsor: 'Sponsor',
  newsletter: 'Newsletter', diger: 'Diğer',
}
const SOURCE_ICONS: Record<string, string> = {
  adsense: '💰', affiliate: '🔗', sponsor: '📢', newsletter: '📧', diger: '📦',
}
const SOURCE_COLORS: Record<string, string> = {
  adsense: '#f7931a', affiliate: '#00c896', sponsor: '#3b82f6',
  newsletter: '#a855f7', diger: '#606080',
}
const PIE_COLORS = ['#f7931a', '#00c896', '#3b82f6', '#a855f7', '#ef4444']

const EXPENSE_CATS = [
  { key: 'hosting', label: 'Hosting', icon: '🖥️' },
  { key: 'domain', label: 'Domain', icon: '🌐' },
  { key: 'api', label: 'API Ücretleri', icon: '🤖' },
  { key: 'tools', label: 'Araçlar/Yazılım', icon: '🛠️' },
  { key: 'reklam', label: 'Reklam/Tanıtım', icon: '📢' },
  { key: 'other', label: 'Diğer', icon: '📦' },
]

const TODAY = format(new Date(), 'yyyy-MM-dd')

// ─── Helper components ────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24 gap-3 text-[#606080]">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">Yükleniyor...</span>
    </div>
  )
}

function StatCard({
  label, value, color, sub,
}: { label: string; value: string; color: string; sub?: React.ReactNode }) {
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-4">
      <p className="text-xs text-[#606080] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

function PctChange({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) return <span className="text-xs text-[#606080]">—</span>
  const pct = Math.round(((now - prev) / prev) * 100)
  const pos = pct >= 0
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: pos ? '#00c896' : '#ef4444' }}>
      {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {pos ? '+' : ''}{pct}% geçen aya göre
    </span>
  )
}

function FlippaCard({ flippa, avgNet }: { flippa: { low: number; mid: number; high: number; monthsOfData: number }; avgNet?: number }) {
  const avg = avgNet ?? ((flippa.low / 25))
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-3">📊 Site Değerleme Hesabı</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#606080]">Aylık ortalama net</span>
          <span className="text-white">${avg.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#606080]">Düşük (25x)</span>
          <span style={{ color: '#ef4444' }}>${flippa.low.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#606080]">Orta (35x)</span>
          <span style={{ color: '#f7931a' }}>${flippa.mid.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#606080]">Yüksek (45x)</span>
          <span style={{ color: '#00c896' }}>${flippa.high.toFixed(0)}</span>
        </div>
        {'monthsOfData' in flippa && (
          <div className="flex justify-between border-t border-[#1e1e35] pt-2 mt-2">
            <span className="text-[#606080]">Veri</span>
            <span className="text-xs" style={{ color: flippa.monthsOfData >= 6 ? '#00c896' : '#f7931a' }}>
              {flippa.monthsOfData} ay {flippa.monthsOfData < 6 ? '(en az 6 ay önerilir)' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

// ─── TAB 1: ÖZET ─────────────────────────────────────────────────────────────

function OzetTab() {
  const { error } = useToast()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/superadmin/gelir/ozet')
        if (!res.ok) throw new Error()
        setSummary(await res.json())
      } catch {
        error('Özet veriler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />
  if (!summary) return <p className="text-[#606080] text-sm p-6">Veri yüklenemedi.</p>

  const pieData = Object.entries(summary.bySource).map(([key, val], i) => ({
    name: SOURCE_LABELS[key] ?? key,
    value: val,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const totalBySource = pieData.reduce((a, b) => a + b.value, 0)

  const last6 = [...summary.monthly].slice(-6)

  const renderPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: {
    cx?: number; cy?: number; midAngle?: number
    innerRadius?: number; outerRadius?: number; percent?: number
  }) => {
    const RADIAN = Math.PI / 180
    const cxV = cx ?? 0
    const cyV = cy ?? 0
    const irV = innerRadius ?? 0
    const orV = outerRadius ?? 0
    const maV = midAngle ?? 0
    const pct = percent ?? 0
    if (pct < 0.05) return null
    const radius = irV + (orV - irV) * 0.5
    const x = cxV + radius * Math.cos(-maV * RADIAN)
    const y = cyV + radius * Math.sin(-maV * RADIAN)
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11}>
        {(pct * 100).toFixed(0)}%
      </text>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Bu Ay Gelir"
          value={`$${summary.thisMonth.income.toFixed(2)}`}
          color="#00c896"
          sub={<PctChange now={summary.thisMonth.income} prev={summary.lastMonth.income} />}
        />
        <StatCard
          label="Bu Ay Gider"
          value={`$${summary.thisMonth.expense.toFixed(2)}`}
          color="#ef4444"
          sub={<PctChange now={summary.thisMonth.expense} prev={summary.lastMonth.expense} />}
        />
        <StatCard
          label="Net Kâr"
          value={`$${summary.thisMonth.net.toFixed(2)}`}
          color="#f7931a"
          sub={<PctChange now={summary.thisMonth.net} prev={summary.lastMonth.net} />}
        />
        <StatCard
          label="Yıllık Tahmin"
          value={`$${summary.annualProjection.toFixed(0)}`}
          color="#3b82f6"
        />
      </div>

      {/* Son 6 Ay BarChart */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Son 6 Ay</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={last6} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tickFormatter={(v) => (v as string).split(' ')[0]}
              tick={{ fill: '#606080', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => '$' + v}
              tick={{ fill: '#606080', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#606080' }}
              formatter={(v) => ['$' + ((v as number) ?? 0).toFixed(2), '']}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#606080' }} />
            <Bar dataKey="income" name="Gelir" fill="#00c896" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Line dataKey="net" name="Net" stroke="#f7931a" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Pie + source list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Gelir Kaynakları</h2>
          {pieData.length === 0 ? (
            <p className="text-[#606080] text-sm">Veri yok</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={220} height={180}>
                <Pie
                  data={pieData}
                  cx={105}
                  cy={85}
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="w-full space-y-2">
                {pieData.map((src) => (
                  <div key={src.name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: src.color }} />
                    <span className="text-white flex-1">{src.name}</span>
                    <span className="text-[#606080]">${src.value.toFixed(2)}</span>
                    <span className="text-xs text-[#606080] w-10 text-right">
                      {totalBySource > 0 ? ((src.value / totalBySource) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Flippa */}
        <FlippaCard flippa={summary.flippa} avgNet={summary.thisMonth.net} />
      </div>

      {/* Monthly summary table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35]">
          <h2 className="text-sm font-semibold text-white">Aylık Özet</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e35]">
                {['Ay', 'Gelir', 'Gider', 'Net Kâr'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[#606080] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...summary.monthly].reverse().slice(0, 6).map((row, i) => (
                <tr key={i} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30">
                  <td className="px-5 py-3 text-white">{row.label}</td>
                  <td className="px-5 py-3" style={{ color: '#00c896' }}>${row.income.toFixed(2)}</td>
                  <td className="px-5 py-3" style={{ color: '#ef4444' }}>${row.expense.toFixed(2)}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: row.net >= 0 ? '#00c896' : '#ef4444' }}>
                    ${row.net.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── TAB 2: GELİRLER ─────────────────────────────────────────────────────────

const EMPTY_INCOME_FORM = { source: 'adsense', amount: '', currency: 'USD', description: '', date: TODAY }

function GelirlerTab() {
  const { success, error } = useToast()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [incomeTotal, setIncomeTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editIncome, setEditIncome] = useState<Income | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [form, setForm] = useState(EMPTY_INCOME_FORM)
  const [saving, setSaving] = useState(false)

  const fetchIncomes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.set('month', monthFilter)
      if (sourceFilter) params.set('source', sourceFilter)
      const res = await fetch('/api/superadmin/gelir?' + params.toString())
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIncomes(data.incomes ?? [])
      setIncomeTotal(data.total ?? 0)
    } catch {
      error('Gelirler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [monthFilter, sourceFilter])

  useEffect(() => { fetchIncomes() }, [fetchIncomes])

  function openEdit(inc: Income) {
    setEditIncome(inc)
    setForm({
      source: inc.source,
      amount: String(inc.amount),
      currency: inc.currency,
      description: inc.description ?? '',
      date: inc.date.slice(0, 10),
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      const res = await fetch('/api/superadmin/gelir', {
        method: editIncome ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editIncome ? { id: editIncome.id, ...payload } : payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Hata')
      success(editIncome ? 'Gelir güncellendi' : 'Gelir eklendi')
      setShowAdd(false)
      setEditIncome(null)
      setForm(EMPTY_INCOME_FORM)
      fetchIncomes()
    } catch (err: any) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/superadmin/gelir?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Gelir silindi')
      setDeleteId(null)
      fetchIncomes()
    } catch {
      error('Silme başarısız')
    }
  }

  const isOpen = showAdd || !!editIncome

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={INPUT + ' w-auto'}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="">Tüm Kaynaklar</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="month"
          className={INPUT + ' w-auto'}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
        <button
          onClick={() => { setShowAdd(true); setForm(EMPTY_INCOME_FORM) }}
          className={BTN_BASE + ' bg-[#f7931a] text-[#0a0a14] flex items-center gap-1.5 ml-auto'}
        >
          <Plus size={14} /> Gelir Ekle
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  {['Tarih', 'Kaynak', 'Açıklama', 'Miktar', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[#606080] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#606080]">Gelir bulunamadı</td>
                  </tr>
                ) : incomes.map((inc) => (
                  <tr key={inc.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30">
                    <td className="px-5 py-3 text-[#606080] whitespace-nowrap">{inc.date.slice(0, 10)}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ background: SOURCE_COLORS[inc.source] + '33', color: SOURCE_COLORS[inc.source] }}
                      >
                        {SOURCE_ICONS[inc.source]} {SOURCE_LABELS[inc.source] ?? inc.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#606080]">{inc.description ?? '—'}</td>
                    <td className="px-5 py-3 text-white font-semibold">{inc.currency} {inc.amount.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(inc)}
                          className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-[#f7931a]/10 text-[#606080] hover:text-[#f7931a] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        {deleteId === inc.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(inc.id)}
                              className="px-2 py-1 rounded bg-red-500 text-white text-xs"
                            >Evet</button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2 py-1 rounded bg-[#1e1e35] text-[#606080] text-xs"
                            >İptal</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(inc.id)}
                            className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-red-500/10 text-[#606080] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {incomes.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[#1e1e35]">
                    <td colSpan={3} className="px-5 py-3 text-[#606080] text-sm font-medium">Toplam</td>
                    <td className="px-5 py-3 text-white font-bold">${incomeTotal.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={isOpen} onClose={() => { setShowAdd(false); setEditIncome(null) }} title={editIncome ? 'Gelir Düzenle' : 'Yeni Gelir Ekle'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-2">Kaynak</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, source: k })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{
                    background: form.source === k ? SOURCE_COLORS[k] + '22' : 'transparent',
                    borderColor: form.source === k ? SOURCE_COLORS[k] : '#1e1e35',
                    color: form.source === k ? SOURCE_COLORS[k] : '#606080',
                  }}
                >
                  {SOURCE_ICONS[k]} {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-[#606080] mb-1.5">Miktar</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={INPUT}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Para Birimi</label>
              <select className={INPUT} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>USD</option><option>TRY</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Açıklama</label>
            <input className={INPUT} placeholder="Opsiyonel..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Tarih</label>
            <input type="date" className={INPUT} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowAdd(false); setEditIncome(null) }} className={BTN_BASE + ' flex-1 border border-[#1e1e35] text-[#606080] hover:text-white'}>İptal</button>
            <button type="submit" disabled={saving} className={BTN_BASE + ' flex-1 bg-[#f7931a] text-[#0a0a14] disabled:opacity-50'}>
              {saving ? 'Kaydediliyor...' : editIncome ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── TAB 3: GİDERLER ─────────────────────────────────────────────────────────

const EMPTY_EXPENSE_FORM = { category: 'hosting', description: '', amount: '', currency: 'USD', date: TODAY, recurring: false }

function GiderlerTab() {
  const { success, error } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState('')
  const [form, setForm] = useState(EMPTY_EXPENSE_FORM)
  const [saving, setSaving] = useState(false)
  const [openRecurring, setOpenRecurring] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.set('month', monthFilter)
      const res = await fetch('/api/superadmin/gider?' + params.toString())
      if (!res.ok) throw new Error()
      const data = await res.json()
      setExpenses(data.expenses ?? [])
      setExpenseTotal(data.total ?? 0)
    } catch {
      error('Giderler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [monthFilter])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  function openEdit(exp: Expense) {
    setEditExpense(exp)
    setForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      currency: exp.currency,
      date: exp.date.slice(0, 10),
      recurring: exp.recurring,
    })
    setShowAdd(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      const res = await fetch('/api/superadmin/gider', {
        method: editExpense ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editExpense ? { id: editExpense.id, ...payload } : payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Hata')
      success(editExpense ? 'Gider güncellendi' : 'Gider eklendi')
      setShowAdd(false)
      setEditExpense(null)
      setForm(EMPTY_EXPENSE_FORM)
      fetchExpenses()
    } catch (err: any) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/superadmin/gider?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Gider silindi')
      setDeleteId(null)
      fetchExpenses()
    } catch {
      error('Silme başarısız')
    }
  }

  const recurring = expenses.filter((e) => e.recurring)
  const regular = expenses.filter((e) => !e.recurring)

  const catMap = Object.fromEntries(EXPENSE_CATS.map((c) => [c.key, c]))

  return (
    <div className="space-y-4">
      {/* Sabit Giderler */}
      {recurring.length > 0 && (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Sabit Giderler</h3>
              <p className="text-xs text-[#606080]">Her ay otomatik eklenir</p>
            </div>
            <button
              onClick={() => { setForm({ ...EMPTY_EXPENSE_FORM, recurring: true }); setEditExpense(null); setShowAdd(true) }}
              className={BTN_BASE + ' bg-[#f7931a] text-[#0a0a14] flex items-center gap-1.5 text-xs'}
            >
              <Plus size={13} /> Sabit Gider Ekle
            </button>
          </div>
          <div className="space-y-2">
            {recurring.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a14] border border-[#1e1e35]">
                <span className="text-lg">{catMap[exp.category]?.icon ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{exp.description}</p>
                  <p className="text-xs text-[#606080]">{catMap[exp.category]?.label ?? exp.category}</p>
                </div>
                <span className="text-sm font-semibold text-white">${exp.amount.toFixed(2)}/ay</span>
                <button onClick={() => openEdit(exp)} className="p-1.5 text-[#606080] hover:text-[#f7931a]">
                  <Pencil size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" className={INPUT + ' w-auto'} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
        <button
          onClick={() => { setForm(EMPTY_EXPENSE_FORM); setEditExpense(null); setShowAdd(true) }}
          className={BTN_BASE + ' bg-[#f7931a] text-[#0a0a14] flex items-center gap-1.5 ml-auto'}
        >
          <Plus size={14} /> Gider Ekle
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  {['Tarih', 'Kategori', 'Açıklama', 'Tekrarlayan', 'Miktar', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[#606080] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#606080]">Gider bulunamadı</td>
                  </tr>
                ) : expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30">
                    <td className="px-5 py-3 text-[#606080] whitespace-nowrap">{exp.date.slice(0, 10)}</td>
                    <td className="px-5 py-3 text-white">{catMap[exp.category]?.icon} {catMap[exp.category]?.label ?? exp.category}</td>
                    <td className="px-5 py-3 text-[#606080]">{exp.description}</td>
                    <td className="px-5 py-3">
                      {exp.recurring ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c896]/10 text-[#00c896]">Sabit</span>
                      ) : <span className="text-[#606080]">—</span>}
                    </td>
                    <td className="px-5 py-3 text-white font-semibold">{exp.currency} {exp.amount.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-[#f7931a]/10 text-[#606080] hover:text-[#f7931a] transition-colors">
                          <Pencil size={13} />
                        </button>
                        {deleteId === exp.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(exp.id)} className="px-2 py-1 rounded bg-red-500 text-white text-xs">Evet</button>
                            <button onClick={() => setDeleteId(null)} className="px-2 py-1 rounded bg-[#1e1e35] text-[#606080] text-xs">İptal</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-red-500/10 text-[#606080] hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[#1e1e35]">
                    <td colSpan={4} className="px-5 py-3 text-[#606080] font-medium">Toplam</td>
                    <td className="px-5 py-3 text-white font-bold">${expenseTotal.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditExpense(null) }} title={editExpense ? 'Gider Düzenle' : 'Yeni Gider Ekle'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Kategori</label>
            <select className={INPUT} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATS.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Açıklama</label>
            <input className={INPUT} placeholder="Hostinger..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-[#606080] mb-1.5">Miktar</label>
              <input type="number" step="0.01" min="0" className={INPUT} placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Para Birimi</label>
              <select className={INPUT} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>USD</option><option>TRY</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Tarih</label>
            <input type="date" className={INPUT} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="w-4 h-4 accent-[#f7931a]" />
            <span className="text-sm text-[#606080]">Sabit gider (her ay)</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowAdd(false); setEditExpense(null) }} className={BTN_BASE + ' flex-1 border border-[#1e1e35] text-[#606080] hover:text-white'}>İptal</button>
            <button type="submit" disabled={saving} className={BTN_BASE + ' flex-1 bg-[#f7931a] text-[#0a0a14] disabled:opacity-50'}>
              {saving ? 'Kaydediliyor...' : editExpense ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── TAB 4: AFFİLİATE ────────────────────────────────────────────────────────

const EMPTY_LINK_FORM = { name: '', slug: '', url: '', keywords: '', commission: '0' }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function AffiliateTab() {
  const { success, error } = useToast()
  const [links, setLinks] = useState<AffLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editLink, setEditLink] = useState<AffLink | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_LINK_FORM)
  const [saving, setSaving] = useState(false)

  async function fetchLinks() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/affiliate')
      if (!res.ok) throw new Error()
      setLinks(await res.json())
    } catch {
      error('Affiliate linkler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLinks() }, [])

  function openEdit(link: AffLink) {
    setEditLink(link)
    setForm({ name: link.name, slug: link.slug, url: link.url, keywords: link.keywords, commission: String(link.commission) })
    setShowAdd(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, commission: parseFloat(form.commission) }
      const res = await fetch('/api/superadmin/affiliate', {
        method: editLink ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLink ? { id: editLink.id, ...payload } : payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Hata')
      success(editLink ? 'Link güncellendi' : 'Link eklendi')
      setShowAdd(false)
      setEditLink(null)
      setForm(EMPTY_LINK_FORM)
      fetchLinks()
    } catch (err: any) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(link: AffLink) {
    try {
      const res = await fetch('/api/superadmin/affiliate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id, active: !link.active }),
      })
      if (!res.ok) throw new Error()
      fetchLinks()
    } catch {
      error('Güncelleme başarısız')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/superadmin/affiliate?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Link silindi')
      setDeleteId(null)
      fetchLinks()
    } catch {
      error('Silme başarısız')
    }
  }

  const totalClicks = links.reduce((a, b) => a + b.clicks, 0)
  const thisMonthClicks = links.reduce((a, b) => a + b.clicksThisMonth, 0)
  const bestLink = links.reduce<AffLink | null>((best, l) => (!best || l.clicks > best.clicks) ? l : best, null)

  const barData = links.map((l) => ({ name: l.name, clicks: l.clicks }))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Toplam Tıklama" value={totalClicks.toLocaleString()} color="#f7931a" />
        <StatCard label="Bu Ay" value={thisMonthClicks.toLocaleString()} color="#00c896" />
        <StatCard label="En İyi Link" value={bestLink?.name ?? '—'} color="#3b82f6" />
      </div>

      {/* BarChart */}
      {links.length > 0 && (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Link Tıklamaları</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#606080', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#606080', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#606080' }}
                formatter={(v) => [v, 'Tıklama']}
              />
              <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Link table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e35]">
          <h2 className="text-sm font-semibold text-white">Affiliate Linkler</h2>
          <button
            onClick={() => { setForm(EMPTY_LINK_FORM); setEditLink(null); setShowAdd(true) }}
            className={BTN_BASE + ' bg-[#f7931a] text-[#0a0a14] flex items-center gap-1.5'}
          >
            <Plus size={14} /> Link Ekle
          </button>
        </div>
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  {['Link', 'URL', 'Slug', 'Tıklama', 'Bu Ay', 'Kom.%', 'Durum', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[#606080] font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-[#606080]">Henüz link yok</td></tr>
                ) : links.map((link) => (
                  <tr key={link.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{link.name}</td>
                    <td className="px-4 py-3 text-[#606080] max-w-[140px]">
                      <span className="block truncate text-xs">{link.url.replace(/^https?:\/\//, '')}</span>
                    </td>
                    <td className="px-4 py-3 text-[#606080] text-xs whitespace-nowrap">/git/{link.slug}</td>
                    <td className="px-4 py-3 text-white">{link.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-white">{link.clicksThisMonth.toLocaleString()}</td>
                    <td className="px-4 py-3 text-white">%{link.commission}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(link)}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        style={{ background: link.active ? '#00c896' : '#1e1e35' }}
                      >
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                          style={{ transform: link.active ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(link)} className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-[#f7931a]/10 text-[#606080] hover:text-[#f7931a] transition-colors">
                          <Pencil size={13} />
                        </button>
                        {deleteId === link.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(link.id)} className="px-2 py-1 rounded bg-red-500 text-white text-xs">Evet</button>
                            <button onClick={() => setDeleteId(null)} className="px-2 py-1 rounded bg-[#1e1e35] text-[#606080] text-xs">İptal</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteId(link.id)} className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-red-500/10 text-[#606080] hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditLink(null) }} title={editLink ? 'Link Düzenle' : 'Yeni Affiliate Link'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Platform Adı</label>
            <input
              className={INPUT}
              placeholder="Amazon Affiliate"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm({ ...form, name, slug: slugify(name) })
              }}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">URL</label>
            <input type="url" className={INPUT} placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Slug (otomatik)</label>
            <input className={INPUT} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="amazon-affiliate" required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Anahtar Kelimeler (virgülle ayırın)</label>
            <input className={INPUT} placeholder="bitcoin, kripto" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Komisyon %</label>
            <input type="number" step="0.1" min="0" max="100" className={INPUT} placeholder="5" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowAdd(false); setEditLink(null) }} className={BTN_BASE + ' flex-1 border border-[#1e1e35] text-[#606080] hover:text-white'}>İptal</button>
            <button type="submit" disabled={saving} className={BTN_BASE + ' flex-1 bg-[#f7931a] text-[#0a0a14] disabled:opacity-50'}>
              {saving ? 'Kaydediliyor...' : editLink ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── TAB 5: RAPORLAR ─────────────────────────────────────────────────────────

type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === 'thisMonth') {
    return {
      startDate: format(new Date(y, m, 1), 'yyyy-MM-dd'),
      endDate: format(new Date(y, m + 1, 0), 'yyyy-MM-dd'),
    }
  }
  if (period === 'lastMonth') {
    return {
      startDate: format(new Date(y, m - 1, 1), 'yyyy-MM-dd'),
      endDate: format(new Date(y, m, 0), 'yyyy-MM-dd'),
    }
  }
  return {
    startDate: format(new Date(y, 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(y, 11, 31), 'yyyy-MM-dd'),
  }
}

function downloadCSV(report: Report) {
  const rows: string[] = [
    'TÜR,TARİH,KAYNAK/KATEGORİ,AÇIKLAMA,MİKTAR,PARA BİRİMİ',
    ...report.incomes.map((i) =>
      `GELİR,${i.date.slice(0, 10)},${i.source},${(i.description ?? '').replace(/,/g, ' ')},${i.amount},${i.currency}`
    ),
    ...report.expenses.map((e) =>
      `GİDER,${e.date.slice(0, 10)},${e.category},${e.description.replace(/,/g, ' ')},${e.amount},${e.currency}`
    ),
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rapor-${report.period.startDate}-${report.period.endDate}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function RaporlarTab() {
  const { error } = useToast()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchReport(p: Period, cs?: string, ce?: string) {
    setLoading(true)
    try {
      let range: { startDate: string; endDate: string }
      if (p === 'custom' && cs && ce) {
        range = { startDate: cs, endDate: ce }
      } else if (p !== 'custom') {
        range = getDateRange(p)
      } else {
        return
      }
      const params = new URLSearchParams(range)
      const res = await fetch('/api/superadmin/rapor?' + params.toString())
      if (!res.ok) throw new Error()
      setReport(await res.json())
    } catch {
      error('Rapor yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (period !== 'custom') fetchReport(period)
  }, [period])

  const PERIOD_BTNS: { key: Period; label: string }[] = [
    { key: 'thisMonth', label: 'Bu Ay' },
    { key: 'lastMonth', label: 'Geçen Ay' },
    { key: 'thisYear', label: 'Bu Yıl' },
    { key: 'custom', label: 'Özel' },
  ]

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_BTNS.map((b) => (
          <button
            key={b.key}
            onClick={() => setPeriod(b.key)}
            className={BTN_BASE + ' ' + (period === b.key ? 'bg-[#f7931a] text-[#0a0a14]' : 'bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white')}
          >
            {b.label}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" className={INPUT + ' w-auto'} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <span className="text-[#606080]">—</span>
            <input type="date" className={INPUT + ' w-auto'} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            <button
              onClick={() => fetchReport('custom', customStart, customEnd)}
              className={BTN_BASE + ' bg-[#f7931a] text-[#0a0a14]'}
            >
              Raporu Getir
            </button>
          </>
        )}
      </div>

      {loading && <Spinner />}

      {!loading && report && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Toplam Gelir" value={`$${report.totalIncome.toFixed(2)}`} color="#00c896" />
            <StatCard label="Toplam Gider" value={`$${report.totalExpense.toFixed(2)}`} color="#ef4444" />
            <StatCard
              label="Net Kâr"
              value={`$${report.netProfit.toFixed(2)}`}
              color={report.netProfit >= 0 ? '#00c896' : '#ef4444'}
            />
          </div>

          {/* Gelir kaynakları */}
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Gelir Kaynakları</h3>
            <div className="space-y-3">
              {Object.entries(report.bySource).map(([key, amount]) => {
                const pct = report.totalIncome > 0 ? (amount / report.totalIncome) * 100 : 0
                const color = SOURCE_COLORS[key] ?? '#606080'
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-white">{SOURCE_ICONS[key]} {SOURCE_LABELS[key] ?? key}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#606080]">${amount.toFixed(2)}</span>
                        <span className="text-xs w-10 text-right" style={{ color }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0a0a14] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Flippa */}
          <FlippaCard flippa={{ ...report.flippa, monthsOfData: 0 }} avgNet={report.netProfit} />

          {/* Download */}
          <div>
            <button
              onClick={() => downloadCSV(report)}
              className={BTN_BASE + ' bg-[#16162a] border border-[#1e1e35] text-white hover:border-[#f7931a] flex items-center gap-2'}
            >
              <Download size={15} /> CSV Rapor İndir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'ozet', label: 'Özet', icon: '📊' },
  { key: 'gelirler', label: 'Gelirler', icon: '💰' },
  { key: 'giderler', label: 'Giderler', icon: '💸' },
  { key: 'affiliate', label: 'Affiliate', icon: '🔗' },
  { key: 'raporlar', label: 'Raporlar', icon: '📈' },
]

export default function GelirPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ozet')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Gelir Yönetimi</h1>
        <p className="text-xs text-[#606080] mt-0.5">Gelir, gider ve affiliate takibi</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#1e1e35] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
            style={{
              borderBottomColor: activeTab === tab.key ? '#f7931a' : 'transparent',
              color: activeTab === tab.key ? '#f7931a' : '#606080',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'ozet' && <OzetTab />}
      {activeTab === 'gelirler' && <GelirlerTab />}
      {activeTab === 'giderler' && <GiderlerTab />}
      {activeTab === 'affiliate' && <AffiliateTab />}
      {activeTab === 'raporlar' && <RaporlarTab />}
    </div>
  )
}
