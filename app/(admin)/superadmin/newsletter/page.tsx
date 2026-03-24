'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Mail, Users, Search, Trash2, Download, Send, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

interface NewsletterData {
  subscribers: Subscriber[]
  totalActive: number
  growthData: { date: string; count: number }[]
}

type Tab = 'Aboneler' | 'Bülten Gönder'

const INPUT =
  'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm'

export default function NewsletterPage() {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('Aboneler')
  const [data, setData] = useState<NewsletterData | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [deleteSubEmail, setDeleteSubEmail] = useState<string | null>(null)
  const [deletingSub, setDeletingSub] = useState(false)

  // Bülten Gönder
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/newsletter?tab=subscribers')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredSubs = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.subscribers
    const q = search.toLowerCase()
    return data.subscribers.filter((s) => s.email.toLowerCase().includes(q))
  }, [data, search])

  async function handleDeleteSub() {
    if (!deleteSubEmail) return
    setDeletingSub(true)
    try {
      const res = await fetch(`/api/superadmin/newsletter?email=${encodeURIComponent(deleteSubEmail)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Abone silindi')
      setDeleteSubEmail(null)
      fetchData()
    } catch {
      error('Silme başarısız')
    } finally {
      setDeletingSub(false)
    }
  }

  function downloadCSV() {
    if (!data) return
    const rows = [
      ['Email', 'Durum', 'Kayıt Tarihi'],
      ...data.subscribers.map((s) => [
        s.email,
        s.active ? 'Aktif' : 'Pasif',
        format(new Date(s.createdAt), 'dd.MM.yyyy HH:mm'),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aboneler-${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    success('CSV indiriliyor...')
  }

  async function handleSendNewsletter(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) return
    setSending(true)
    setSentMsg(null)
    try {
      const res = await fetch('/api/superadmin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Hata')
      setSentMsg(`${json.sent} aboneye gönderildi`)
      success(`Bülten ${json.sent} aboneye gönderildi`)
      setSubject('')
      setContent('')
    } catch (err: any) {
      error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center">
          <Mail size={20} className="text-[#f7931a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Newsletter</h1>
          <p className="text-xs text-[#606080]">Abone yönetimi & bülten gönderimi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#16162a] border border-[#1e1e35] rounded-xl p-1 w-fit">
        {(['Aboneler', 'Bülten Gönder'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#f7931a] text-white'
                : 'text-[#606080] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#606080]">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Yükleniyor...</span>
        </div>
      ) : activeTab === 'Aboneler' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-4">
              <p className="text-xs text-[#606080] mb-1">Toplam Abone</p>
              <p className="text-2xl font-bold text-white">{data?.subscribers.length ?? 0}</p>
            </div>
            <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-4">
              <p className="text-xs text-[#606080] mb-1">Aktif Abone</p>
              <p className="text-2xl font-bold text-[#00c896]">{data?.totalActive ?? 0}</p>
            </div>
          </div>

          {/* Growth Chart */}
          {(data?.growthData?.length ?? 0) > 0 && (
            <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Son 30 Gün Büyüme</h2>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data!.growthData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#606080', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <Tooltip
                    contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#606080' }}
                    itemStyle={{ color: '#f7931a' }}
                    formatter={(v) => [v ?? 0, 'Yeni Abone']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f7931a" strokeWidth={2} fill="url(#subGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e35] gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606080]" />
                <input
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm"
                  placeholder="Email ile ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e1e35] hover:bg-[#f7931a]/10 hover:text-[#f7931a] text-[#606080] text-xs transition-colors"
              >
                <Download size={13} />
                CSV İndir
              </button>
            </div>

            {filteredSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Users size={28} className="text-[#1e1e35]" />
                <p className="text-[#606080] text-sm">Henüz veri yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e1e35]">
                      <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Email</th>
                      <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Durum</th>
                      <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Kayıt Tarihi</th>
                      <th className="text-left px-5 py-3.5 text-[#606080] font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((sub) => (
                      <tr key={sub.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30 transition-colors">
                        <td className="px-5 py-3.5 text-white">{sub.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            sub.active
                              ? 'bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20'
                              : 'bg-[#1e1e35] text-[#606080] border border-[#1e1e35]'
                          }`}>
                            {sub.active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[#606080]">
                          {format(new Date(sub.createdAt), 'dd.MM.yyyy', { locale: tr })}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setDeleteSubEmail(sub.email)}
                            className="p-1.5 rounded-lg bg-[#1e1e35] hover:bg-red-500/10 hover:text-red-400 text-[#606080] transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Bülten Gönder Tab */
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Send size={16} className="text-[#f7931a]" />
            <h2 className="text-sm font-semibold text-white">Bülten Gönder</h2>
          </div>

          <div className="mb-4 px-4 py-3 rounded-xl bg-[#f7931a]/5 border border-[#f7931a]/10 flex items-center gap-2">
            <Users size={14} className="text-[#f7931a]" />
            <span className="text-sm text-[#606080]">
              Hedef: <span className="text-white font-medium">{data?.totalActive ?? 0} aktif abone</span>
            </span>
          </div>

          {sentMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-[#00c896]/5 border border-[#00c896]/20 text-sm text-[#00c896]">
              ✅ {sentMsg}
            </div>
          )}

          <form onSubmit={handleSendNewsletter} className="space-y-4">
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Konu</label>
              <input
                className={INPUT}
                placeholder="Haftalık Teknoloji Bülteni - 20 Mart 2026"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Mesaj</label>
              <textarea
                className={INPUT + ' min-h-[220px] resize-y'}
                placeholder="Bülten içeriğini buraya yazın..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending || (data?.totalActive ?? 0) === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {sending ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Tüm Abonelere Gönder
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteSubEmail}
        onClose={() => setDeleteSubEmail(null)}
        onConfirm={handleDeleteSub}
        title="Aboneyi Sil"
        message={`"${deleteSubEmail}" adresini abone listesinden kaldırmak istediğinizden emin misiniz?`}
        confirmLabel="Evet, Sil"
        danger
        loading={deletingSub}
      />
    </div>
  )
}
