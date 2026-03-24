'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getPlatformMeta } from '@/lib/ai-models'
import { useToast } from '@/components/ui/Toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface PlatformStat {
  id: string
  name: string
  slug: string
  active: boolean
  isPrimary: boolean
  isBackup: boolean
  totalTokens: number
  recentTokens: number
  recentCost: number
  requestCount: number
  successRate: number
  avgDuration: number
}

interface DailyEntry {
  date: string
  tokens: number
  requests: number
  cost: number
}

interface RecentLog {
  id: string
  platformName: string
  platformSlug: string
  tokens: number
  cost: number
  duration: number
  success: boolean
  prompt: string
  createdAt: string
}

interface Stats {
  platformStats: PlatformStat[]
  daily: DailyEntry[]
  recentLogs: RecentLog[]
}

const DAY_OPTIONS = [7, 30, 90]

export default function AiIstatistikPage() {
  const toast = useToast()
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch(`/api/superadmin/ai-platformlar/istatistik?days=${days}`)
      if (!res.ok) throw new Error('Veri alınamadı')
      const data: Stats = await res.json()
      setStats(data)
    } catch {
      toast.error('İstatistikler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  function dayLabel(date: string) {
    // Show last 2 chars = day number
    return date.slice(-2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#f7931a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Kullanım İstatistikleri</h1>
          <p className="text-[#606080] mt-1">Token kullanımı, maliyet ve platform performansı</p>
        </div>

        {/* Days selector */}
        <div className="flex gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                days === d
                  ? 'bg-[#f7931a] border-[#f7931a] text-white'
                  : 'border-[#1e1e35] text-[#606080] hover:text-white hover:border-[#606080]'
              }`}
            >
              {d} gün
            </button>
          ))}
        </div>
      </div>

      {!stats && (
        <div className="text-center py-16 text-[#606080]">Veri bulunamadı</div>
      )}

      {stats && (
        <>
          {/* [1] Platform stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.platformStats.map((ps) => {
              const meta = getPlatformMeta(ps.slug)
              return (
                <div
                  key={ps.id}
                  className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4"
                  style={{ borderLeftColor: meta?.color ?? '#1e1e35', borderLeftWidth: 3 }}
                >
                  {/* Platform header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta?.icon ?? '🤖'}</span>
                      <span className="text-white font-semibold text-sm">{ps.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {ps.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#f7931a]/20 text-[#f7931a]">⭐</span>
                      )}
                      {ps.isBackup && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">🔄</span>
                      )}
                      {!ps.active && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#606080]/20 text-[#606080]">PASİF</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#606080]">Token (son {days}g)</span>
                      <span className="text-white font-mono">{ps.recentTokens.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606080]">Maliyet</span>
                      <span className="text-white font-mono">${ps.recentCost.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606080]">İstek</span>
                      <span className="text-white">{ps.requestCount.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606080]">Başarı</span>
                      <span
                        className={`font-medium ${
                          ps.successRate >= 90
                            ? 'text-[#00c896]'
                            : ps.successRate >= 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {ps.successRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#606080]">Ort. süre</span>
                      <span className="text-white">{ps.avgDuration.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {stats.platformStats.length === 0 && (
              <div className="col-span-full text-center py-8 text-[#606080]">
                Henüz platform istatistiği yok
              </div>
            )}
          </div>

          {/* [2] Daily token line chart */}
          {stats.daily.length > 0 && (
            <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 mb-6">
              <h2 className="text-white font-bold mb-4">Günlük Token Kullanımı</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.daily} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={dayLabel}
                    tick={{ fill: '#606080', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e35' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#606080', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  />
                  <Tooltip
                    contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }}
                    labelStyle={{ color: '#606080' }}
                    itemStyle={{ color: '#f7931a' }}
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString('tr-TR') + ' token' : v, '']}
                  />
                  <Legend wrapperStyle={{ color: '#606080', fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    name="Token"
                    stroke="#f7931a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#f7931a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* [3] Daily requests bar chart */}
          {stats.daily.length > 0 && (
            <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 mb-6">
              <h2 className="text-white font-bold mb-4">Günlük İstek Sayısı</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.daily} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={dayLabel}
                    tick={{ fill: '#606080', fontSize: 11 }}
                    axisLine={{ stroke: '#1e1e35' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#606080', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }}
                    labelStyle={{ color: '#606080' }}
                    itemStyle={{ color: '#00c896' }}
                    formatter={(v) => [v, 'İstek']}
                  />
                  <Bar dataKey="requests" name="İstek" fill="#00c896" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* [4] Recent logs table */}
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e35]">
              <h2 className="text-white font-bold">Son İşlemler</h2>
            </div>
            {stats.recentLogs.length === 0 ? (
              <div className="py-12 text-center text-[#606080]">Henüz log yok</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e35]">
                      {['Tarih', 'Platform', 'Prompt', 'Token', 'Süre', 'Maliyet', 'Durum'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-[#606080] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentLogs.map((log) => {
                      const meta = getPlatformMeta(log.platformSlug)
                      let dateStr = ''
                      try {
                        dateStr = format(new Date(log.createdAt), 'dd.MM HH:mm', { locale: tr })
                      } catch {
                        dateStr = log.createdAt
                      }
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-[#1e1e35]/50 hover:bg-[#1e1e35]/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-[#606080] whitespace-nowrap text-xs font-mono">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{meta?.icon ?? '🤖'}</span>
                              <span className="text-white text-xs">{log.platformName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#606080] text-xs max-w-[200px]">
                            <span title={log.prompt}>
                              {log.prompt.length > 50 ? log.prompt.slice(0, 50) + '…' : log.prompt}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white text-xs font-mono whitespace-nowrap">
                            {log.tokens.toLocaleString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-white text-xs whitespace-nowrap">
                            {log.duration}ms
                          </td>
                          <td className="px-4 py-3 text-white text-xs font-mono whitespace-nowrap">
                            ${log.cost.toFixed(5)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.success ? (
                              <span className="text-[#00c896] text-base">✅</span>
                            ) : (
                              <span className="text-red-400 text-base">❌</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
