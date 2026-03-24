'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart2, MapPin, PlusCircle, FlaskConical, TrendingUp, Settings2,
  RefreshCw, Trash2, Pencil, Power, CheckCircle, XCircle, Zap, Eye,
  MousePointerClick, Trophy, X, Save,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────

interface AdZone {
  id: string
  name: string
  slug: string
  description?: string
  position: string
  size: string
  active: boolean
  ads: { id: string; name: string; type: string }[]
  _count: { clicks: number }
}

interface Ad {
  id: string
  name: string
  zoneId: string
  zone: { id: string; name: string; slug: string; size: string }
  type: string
  code: string
  imageUrl: string | null
  linkUrl: string | null
  active: boolean
  isAbTest: boolean
  abGroup: string | null
  impressions: number
  startDate: string | null
  endDate: string | null
  price: number | null
}

interface AbTestGroup {
  zone: { id: string; name: string; slug: string }
  a?: Ad & { _count: { clicks: number } }
  b?: Ad & { _count: { clicks: number } }
}

interface AdSenseConfig {
  id?: string
  publisherId: string
  autoAdsOn: boolean
  active: boolean
}

interface Stats {
  summary: { activeAds: number; todayClicks: number; totalClicks: number; ctr: string }
  zoneStats: { id: string; name: string; slug: string; size: string; position: string; active: boolean; activeAd: string | null; impressions: number; clicks: number; ctr: string }[]
  byPage: { page: string | null; clicks: number }[]
  adStats: { id: string; name: string; type: string; impressions: number; clicks: number; ctr: string }[]
  dailyData: { date: string; count: number }[]
}

const AD_TYPES = [
  { value: 'ADSENSE_AUTO', label: 'AdSense Otomatik' },
  { value: 'ADSENSE_MANUAL', label: 'AdSense Manuel Slot' },
  { value: 'CUSTOM_HTML', label: 'Özel HTML Kodu' },
  { value: 'AFFILIATE_BANNER', label: 'Affiliate Banner' },
  { value: 'SPONSORED', label: 'Sponsorlu İçerik' },
]

const TABS = [
  { id: 'overview', label: 'Genel Bakış', icon: BarChart2 },
  { id: 'zones', label: 'Reklam Alanları', icon: MapPin },
  { id: 'ads', label: 'Reklamlar', icon: PlusCircle },
  { id: 'abtest', label: 'A/B Test', icon: FlaskConical },
  { id: 'stats', label: 'İstatistikler', icon: TrendingUp },
  { id: 'adsense', label: 'AdSense', icon: Settings2 },
] as const

type TabId = typeof TABS[number]['id']

const INPUT = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#f7931a]'
const LABEL = 'block text-xs text-[#606080] mb-1.5'

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReklamlarPage() {
  const { success, error } = useToast()
  const [tab, setTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(false)

  const [zones, setZones] = useState<AdZone[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [abTests, setAbTests] = useState<AbTestGroup[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [adsense, setAdsense] = useState<AdSenseConfig>({ publisherId: '', autoAdsOn: false, active: false })
  const [statsPeriod, setStatsPeriod] = useState('month')

  // Form state
  const [showAdForm, setShowAdForm] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [adForm, setAdForm] = useState({
    name: '', zoneId: '', type: 'ADSENSE_AUTO', code: '', imageUrl: '', linkUrl: '',
    isAbTest: false, abGroup: '', startDate: '', endDate: '', price: '',
  })

  // A/B Test form
  const [abForm, setAbForm] = useState({ zoneId: '', adAId: '', adBId: '' })
  const [showAbForm, setShowAbForm] = useState(false)

  // Zone assign modal
  const [assignZone, setAssignZone] = useState<AdZone | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [zonesRes, adsRes, abRes] = await Promise.all([
        fetch('/api/superadmin/reklamlar/zonlar'),
        fetch('/api/superadmin/reklamlar'),
        fetch('/api/superadmin/reklamlar/ab-test'),
      ])
      const zonesData = await zonesRes.json()
      const adsData = await adsRes.json()
      const abData = await abRes.json()
      if (Array.isArray(zonesData)) setZones(zonesData)
      if (Array.isArray(adsData)) setAds(adsData)
      if (Array.isArray(abData)) setAbTests(abData)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/superadmin/reklamlar/istatistik?period=${statsPeriod}`)
      if (!res.ok) return
      const data = await res.json()
      if (data?.summary) setStats(data)
    } catch { /* silent */ }
  }, [statsPeriod])

  const fetchAdsense = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/reklamlar/adsense')
      setAdsense(await res.json())
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAll(); fetchAdsense() }, [fetchAll, fetchAdsense])
  useEffect(() => { if (tab === 'overview' || tab === 'stats') fetchStats() }, [tab, fetchStats, statsPeriod])

  // ── Ad CRUD ───────────────────────────────────────────────────────────────

  function openAdForm(ad?: Ad) {
    if (ad) {
      setEditingAd(ad)
      setAdForm({
        name: ad.name, zoneId: ad.zoneId, type: ad.type, code: ad.code,
        imageUrl: ad.imageUrl || '', linkUrl: ad.linkUrl || '',
        isAbTest: ad.isAbTest, abGroup: ad.abGroup || '',
        startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
        endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
        price: ad.price ? String(ad.price) : '',
      })
    } else {
      setEditingAd(null)
      setAdForm({ name: '', zoneId: assignZone?.id || '', type: 'ADSENSE_AUTO', code: '', imageUrl: '', linkUrl: '', isAbTest: false, abGroup: '', startDate: '', endDate: '', price: '' })
    }
    setShowAdForm(true)
    setAssignZone(null)
  }

  async function saveAd() {
    if (!adForm.name || !adForm.zoneId) { error('İsim ve alan zorunlu'); return }
    try {
      const url = editingAd ? `/api/superadmin/reklamlar/${editingAd.id}` : '/api/superadmin/reklamlar'
      const method = editingAd ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adForm),
      })
      if (!res.ok) throw new Error()
      success(editingAd ? 'Reklam güncellendi' : 'Reklam eklendi')
      setShowAdForm(false)
      fetchAll()
    } catch { error('İşlem başarısız') }
  }

  async function deleteAd(id: string) {
    if (!confirm('Bu reklamı silmek istediğinize emin misiniz?')) return
    try {
      await fetch(`/api/superadmin/reklamlar/${id}`, { method: 'DELETE' })
      success('Reklam silindi')
      fetchAll()
    } catch { error('Silinemedi') }
  }

  async function toggleAdActive(ad: Ad) {
    try {
      await fetch(`/api/superadmin/reklamlar/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !ad.active }),
      })
      fetchAll()
    } catch { error('Güncelleme başarısız') }
  }

  async function toggleZone(zone: AdZone) {
    try {
      await fetch('/api/superadmin/reklamlar/zonlar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zone.id, active: !zone.active }),
      })
      fetchAll()
    } catch { error('Güncelleme başarısız') }
  }

  // ── A/B Test ──────────────────────────────────────────────────────────────

  async function startAbTest() {
    if (!abForm.zoneId || !abForm.adAId || !abForm.adBId) { error('Tüm alanları doldurun'); return }
    try {
      const res = await fetch('/api/superadmin/reklamlar/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abForm),
      })
      if (!res.ok) throw new Error()
      success('A/B Test başlatıldı')
      setShowAbForm(false)
      fetchAll()
    } catch { error('İşlem başarısız') }
  }

  async function applyAbTest(winnerAdId: string, loserAdId: string, action: 'apply' | 'stop') {
    try {
      await fetch('/api/superadmin/reklamlar/ab-test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerAdId, loserAdId, action }),
      })
      success(action === 'apply' ? 'Kazanan uygulandı' : 'Test durduruldu')
      fetchAll()
    } catch { error('İşlem başarısız') }
  }

  // ── AdSense Save ──────────────────────────────────────────────────────────

  async function saveAdsense() {
    try {
      const res = await fetch('/api/superadmin/reklamlar/adsense', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adsense),
      })
      if (!res.ok) throw new Error()
      success('AdSense ayarları kaydedildi')
    } catch { error('Kayıt başarısız') }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function typeBadge(type: string) {
    const map: Record<string, string> = {
      ADSENSE_AUTO: 'bg-blue-500/15 text-blue-400',
      ADSENSE_MANUAL: 'bg-blue-500/10 text-blue-300',
      CUSTOM_HTML: 'bg-purple-500/15 text-purple-400',
      AFFILIATE_BANNER: 'bg-[#f7931a]/15 text-[#f7931a]',
      SPONSORED: 'bg-[#00c896]/15 text-[#00c896]',
    }
    const labels: Record<string, string> = {
      ADSENSE_AUTO: 'AdSense Auto', ADSENSE_MANUAL: 'AdSense Manuel',
      CUSTOM_HTML: 'Özel HTML', AFFILIATE_BANNER: 'Affiliate', SPONSORED: 'Sponsorlu',
    }
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${map[type] || 'bg-[#1e1e35] text-[#606080]'}`}>
        {labels[type] || type}
      </span>
    )
  }

  const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 ${className}`}>{children}</div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center">
            <BarChart2 size={20} className="text-[#f7931a]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reklam Yönetimi</h1>
            <p className="text-xs text-[#606080]">5 tür, 10 alan, A/B test, istatistik</p>
          </div>
        </div>
        <button onClick={fetchAll} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16162a] border border-[#1e1e35] text-xs text-[#606080] hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0a0a14] rounded-xl p-1 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-[#f7931a] text-white'
                  : 'text-[#606080] hover:text-white hover:bg-[#1e1e35]'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: GENEL BAKIŞ ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Summary cards */}
          {stats?.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Aktif Reklam', value: stats.summary.activeAds, icon: Zap, color: '#f7931a' },
                { label: 'Bugün Tıklama', value: stats.summary.todayClicks, icon: MousePointerClick, color: '#00c896' },
                { label: 'Bu Ay Tıklama', value: stats.summary.totalClicks, icon: TrendingUp, color: '#3b82f6' },
                { label: 'CTR Oranı', value: `%${stats.summary.ctr}`, icon: BarChart2, color: '#a855f7' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <Card key={s.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{s.value}</p>
                      <p className="text-xs text-[#606080]">{s.label}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Zone status table */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-[#f7931a]" /> Reklam Alanları Durumu
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1e1e35]">
                    {['Alan', 'Boyut', 'Reklam', 'Tıklama', 'Durum'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-[#606080] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.zoneStats || zones.map((z) => ({ ...z, activeAd: z.ads[0]?.name || null, impressions: 0, clicks: z._count.clicks, ctr: '0.0' }))).map((z) => (
                    <tr key={z.id} className="border-b border-[#1e1e35] last:border-0">
                      <td className="px-3 py-2.5 text-white font-medium">{z.name}</td>
                      <td className="px-3 py-2.5 text-[#606080] font-mono">{z.size}</td>
                      <td className="px-3 py-2.5 text-[#606080]">{z.activeAd || <span className="text-[#404060]">—</span>}</td>
                      <td className="px-3 py-2.5 text-[#606080]">{z.clicks}</td>
                      <td className="px-3 py-2.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${z.active ? 'bg-[#00c896]' : 'bg-red-400'}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 7-day chart */}
          {stats && stats.dailyData.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#f7931a]" /> Son 7 Gün Tıklama
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.dailyData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                  <XAxis dataKey="date" tick={{ fill: '#606080', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: '#606080', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#f7931a" strokeWidth={2} dot={false} name="Tıklama" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: REKLAM ALANLARI ── */}
      {tab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <Card key={zone.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#f7931a]" />
                    <span className="text-sm font-semibold text-white">{zone.name}</span>
                    <span className={`w-2 h-2 rounded-full ${zone.active ? 'bg-[#00c896]' : 'bg-red-400'}`} />
                  </div>
                  {zone.description && <p className="text-xs text-[#606080] mt-0.5 ml-5">{zone.description}</p>}
                </div>
                <span className="text-[10px] font-mono text-[#606080] bg-[#0a0a14] px-2 py-0.5 rounded">{zone.size}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#606080]">
                <span>Konum: <span className="text-white">{zone.position}</span></span>
                <span>Reklam: <span className="text-white">{zone.ads.length}</span></span>
                <span>Tıklama: <span className="text-white">{zone._count.clicks}</span></span>
              </div>
              {zone.ads.length > 0 && (
                <div className="text-xs text-[#606080]">
                  Aktif: <span className="text-white">{zone.ads[0].name}</span> {typeBadge(zone.ads[0].type)}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { setAssignZone(zone); setAdForm((f) => ({ ...f, zoneId: zone.id })); setShowAdForm(true); setEditingAd(null) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f7931a]/10 border border-[#f7931a]/20 text-[#f7931a] text-xs hover:bg-[#f7931a]/20 transition-colors"
                >
                  <PlusCircle size={12} /> Reklam Ata
                </button>
                <button
                  onClick={() => toggleZone(zone)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    zone.active
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-[#00c896]/10 border-[#00c896]/20 text-[#00c896] hover:bg-[#00c896]/20'
                  }`}
                >
                  <Power size={12} />
                  {zone.active ? 'Devre Dışı' : 'Aktifleştir'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── TAB: REKLAMLAR ── */}
      {tab === 'ads' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openAdForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors"
            >
              <PlusCircle size={15} /> Yeni Reklam
            </button>
          </div>

          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e1e35] bg-[#0a0a14]">
                  {['İsim', 'Alan', 'Tür', 'Gösterim', 'Durum', 'İşlem'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[#606080] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#606080]">Henüz reklam yok</td></tr>
                ) : ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#0a0a14] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {ad.name}
                      {ad.isAbTest && <span className="ml-2 text-[10px] text-[#f7931a] font-mono">A/B:{ad.abGroup}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#606080]">{ad.zone.name}</td>
                    <td className="px-4 py-3">{typeBadge(ad.type)}</td>
                    <td className="px-4 py-3 text-[#606080]">{ad.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAdActive(ad)}>
                        {ad.active
                          ? <CheckCircle size={14} className="text-[#00c896]" />
                          : <XCircle size={14} className="text-red-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openAdForm(ad)} className="text-[#606080] hover:text-[#f7931a] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteAd(ad.id)} className="text-[#606080] hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB: A/B TEST ── */}
      {tab === 'abtest' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAbForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors"
            >
              <FlaskConical size={15} /> Yeni A/B Test
            </button>
          </div>

          {abTests.length === 0 ? (
            <Card>
              <p className="text-center text-[#606080] text-sm py-4">Aktif A/B test yok</p>
            </Card>
          ) : abTests.map((test, i) => {
            const aClicks = test.a?._count.clicks || 0
            const bClicks = test.b?._count.clicks || 0
            const aImpr = test.a?.impressions || 1
            const bImpr = test.b?.impressions || 1
            const aCtr = ((aClicks / aImpr) * 100).toFixed(1)
            const bCtr = ((bClicks / bImpr) * 100).toFixed(1)
            const winner = parseFloat(aCtr) >= parseFloat(bCtr) ? 'A' : 'B'

            return (
              <Card key={i} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FlaskConical size={14} className="text-[#f7931a]" />
                    {test.zone.name} — A/B Test
                  </h3>
                  <span className="text-[10px] text-[#f7931a] font-mono bg-[#f7931a]/10 px-2 py-0.5 rounded">Aktif</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { group: 'A', ad: test.a, ctr: aCtr, clicks: aClicks, isWinner: winner === 'A' },
                    { group: 'B', ad: test.b, ctr: bCtr, clicks: bClicks, isWinner: winner === 'B' },
                  ].map(({ group, ad, ctr, clicks, isWinner }) => (
                    <div key={group} className={`rounded-xl p-4 border ${isWinner ? 'border-[#f7931a]/40 bg-[#f7931a]/5' : 'border-[#1e1e35] bg-[#0a0a14]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-white">Grup {group}</span>
                        {isWinner && <Trophy size={12} className="text-[#f7931a]" />}
                      </div>
                      <p className="text-xs text-[#606080]">{ad?.name || '—'}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs"><span className="text-[#606080]">CTR:</span> <span className="text-white font-semibold">%{ctr}</span></p>
                        <p className="text-xs"><span className="text-[#606080]">Tıklama:</span> <span className="text-white">{clicks}</span></p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {test.a && test.b && (
                    <>
                      <button
                        onClick={() => applyAbTest(
                          winner === 'A' ? test.a!.id : test.b!.id,
                          winner === 'A' ? test.b!.id : test.a!.id,
                          'apply'
                        )}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00c896]/10 border border-[#00c896]/20 text-[#00c896] text-xs hover:bg-[#00c896]/20 transition-colors"
                      >
                        <Trophy size={12} /> Grup {winner}&apos;ı Uygula
                      </button>
                      <button
                        onClick={() => applyAbTest(test.a!.id, test.b!.id, 'stop')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e35] border border-[#2a2a45] text-[#606080] text-xs hover:text-white transition-colors"
                      >
                        <X size={12} /> Testi Bitir
                      </button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── TAB: İSTATİSTİKLER ── */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            {[['today', 'Bugün'], ['week', 'Bu Hafta'], ['month', 'Bu Ay']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatsPeriod(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statsPeriod === val ? 'bg-[#f7931a] text-white' : 'bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {!stats?.summary ? (
            <Card><p className="text-center text-[#606080] py-4">Yükleniyor...</p></Card>
          ) : (
            <>
              {/* Zone performance */}
              <Card>
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye size={14} className="text-[#f7931a]" /> Alan Bazlı Performans
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1e1e35]">
                        {['Alan', 'Boyut', 'Gösterim', 'Tıklama', 'CTR'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-[#606080] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.zoneStats.map((z) => (
                        <tr key={z.id} className="border-b border-[#1e1e35] last:border-0">
                          <td className="px-3 py-2.5 text-white">{z.name}</td>
                          <td className="px-3 py-2.5 text-[#606080] font-mono">{z.size}</td>
                          <td className="px-3 py-2.5 text-[#606080]">{z.impressions.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-[#606080]">{z.clicks}</td>
                          <td className="px-3 py-2.5 text-[#00c896] font-semibold">%{z.ctr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* By page */}
              {stats.byPage.length > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <MousePointerClick size={14} className="text-[#f7931a]" /> Sayfaya Göre Tıklama
                  </h2>
                  <div className="space-y-2">
                    {stats.byPage.slice(0, 10).map((p) => (
                      <div key={p.page} className="flex items-center justify-between text-xs">
                        <span className="text-[#606080] truncate max-w-xs">{p.page || '—'}</span>
                        <span className="text-white font-medium">{p.clicks}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Daily chart */}
              {stats.dailyData.length > 0 && (
                <Card>
                  <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#f7931a]" /> Günlük Tıklama (30 Gün)
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.dailyData}>
                      <defs>
                        <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                      <XAxis dataKey="date" tick={{ fill: '#606080', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#606080', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#16162a', border: '1px solid #1e1e35', borderRadius: 8 }} />
                      <Area type="monotone" dataKey="count" stroke="#f7931a" strokeWidth={2} fill="url(#clickGrad)" name="Tıklama" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Ad performance */}
              <Card>
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-[#f7931a]" /> Reklam Bazlı Performans
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1e1e35]">
                        {['İsim', 'Tür', 'Gösterim', 'Tıklama', 'CTR'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-[#606080] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.adStats.map((a) => (
                        <tr key={a.id} className="border-b border-[#1e1e35] last:border-0">
                          <td className="px-3 py-2.5 text-white">{a.name}</td>
                          <td className="px-3 py-2.5">{typeBadge(a.type)}</td>
                          <td className="px-3 py-2.5 text-[#606080]">{a.impressions.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-[#606080]">{a.clicks}</td>
                          <td className="px-3 py-2.5 text-[#00c896] font-semibold">%{a.ctr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── TAB: ADSENSE ── */}
      {tab === 'adsense' && (
        <Card className="max-w-xl space-y-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings2 size={14} className="text-[#f7931a]" /> Google AdSense Ayarları
          </h2>

          <div>
            <label className={LABEL}>Publisher ID</label>
            <input
              type="text"
              className={INPUT}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              value={adsense.publisherId}
              onChange={(e) => setAdsense((s) => ({ ...s, publisherId: e.target.value }))}
            />
            <p className="text-xs text-[#606080] mt-1">Google AdSense Publisher ID&apos;nizi girin</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a14] border border-[#1e1e35]">
            <div>
              <p className="text-sm text-white font-medium">AdSense Aktif</p>
              <p className="text-xs text-[#606080] mt-0.5">Sitede AdSense scriptini çalıştır</p>
            </div>
            <button
              onClick={() => setAdsense((s) => ({ ...s, active: !s.active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${adsense.active ? 'bg-[#f7931a]' : 'bg-[#1e1e35]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${adsense.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a14] border border-[#1e1e35]">
            <div>
              <p className="text-sm text-white font-medium">Auto Ads</p>
              <p className="text-xs text-[#606080] mt-0.5">Google otomatik reklam yerleştirir</p>
            </div>
            <button
              onClick={() => setAdsense((s) => ({ ...s, autoAdsOn: !s.autoAdsOn }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${adsense.autoAdsOn ? 'bg-[#f7931a]' : 'bg-[#1e1e35]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${adsense.autoAdsOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {adsense.publisherId && (
            <div className="p-4 rounded-xl bg-[#0a0a14] border border-[#1e1e35]">
              <p className="text-xs text-[#606080] mb-2">Head&apos;e eklenecek script:</p>
              <pre className="text-[10px] text-[#00c896] font-mono overflow-x-auto whitespace-pre-wrap">{`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense.publisherId}" crossorigin="anonymous"></script>`}</pre>
            </div>
          )}

          <button
            onClick={saveAdsense}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors"
          >
            <Save size={14} /> Kaydet
          </button>
        </Card>
      )}

      {/* ── MODAL: Reklam Form ── */}
      {showAdForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1e1e35]">
              <h3 className="text-sm font-semibold text-white">{editingAd ? 'Reklamı Düzenle' : 'Yeni Reklam'}</h3>
              <button onClick={() => setShowAdForm(false)} className="text-[#606080] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={LABEL}>Reklam Adı *</label>
                <input className={INPUT} value={adForm.name} onChange={(e) => setAdForm((f) => ({ ...f, name: e.target.value }))} placeholder="Örn: Binance Banner" />
              </div>
              <div>
                <label className={LABEL}>Reklam Alanı *</label>
                <select className={INPUT} value={adForm.zoneId} onChange={(e) => setAdForm((f) => ({ ...f, zoneId: e.target.value }))}>
                  <option value="">Alan seçin...</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.size})</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Reklam Türü</label>
                <select className={INPUT} value={adForm.type} onChange={(e) => setAdForm((f) => ({ ...f, type: e.target.value }))}>
                  {AD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Type-specific fields */}
              {(adForm.type === 'ADSENSE_AUTO' || adForm.type === 'ADSENSE_MANUAL' || adForm.type === 'CUSTOM_HTML') && (
                <div>
                  <label className={LABEL}>{adForm.type === 'CUSTOM_HTML' ? 'HTML Kodu' : 'AdSense Kodu'}</label>
                  <textarea
                    className={`${INPUT} h-28 resize-none font-mono text-xs`}
                    value={adForm.code}
                    onChange={(e) => setAdForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder={adForm.type === 'ADSENSE_MANUAL' ? '<ins class="adsbygoogle"...' : '<div>...'}
                  />
                </div>
              )}

              {(adForm.type === 'AFFILIATE_BANNER' || adForm.type === 'SPONSORED') && (
                <>
                  <div>
                    <label className={LABEL}>Banner Görsel URL</label>
                    <input className={INPUT} value={adForm.imageUrl} onChange={(e) => setAdForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={LABEL}>Hedef URL</label>
                    <input className={INPUT} value={adForm.linkUrl} onChange={(e) => setAdForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                </>
              )}

              {adForm.type === 'SPONSORED' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Başlangıç Tarihi</label>
                      <input type="date" className={INPUT} value={adForm.startDate} onChange={(e) => setAdForm((f) => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Bitiş Tarihi</label>
                      <input type="date" className={INPUT} value={adForm.endDate} onChange={(e) => setAdForm((f) => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Fiyat (USD)</label>
                    <input type="number" className={INPUT} value={adForm.price} onChange={(e) => setAdForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adForm.isAbTest}
                    onChange={(e) => setAdForm((f) => ({ ...f, isAbTest: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-[#606080]">A/B Test için</span>
                </label>
                {adForm.isAbTest && (
                  <select className="px-2 py-1 rounded bg-[#0a0a14] border border-[#1e1e35] text-white text-xs" value={adForm.abGroup} onChange={(e) => setAdForm((f) => ({ ...f, abGroup: e.target.value }))}>
                    <option value="">Grup seç</option>
                    <option value="A">Grup A</option>
                    <option value="B">Grup B</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={saveAd} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors">
                  <Save size={14} /> Kaydet
                </button>
                <button onClick={() => setShowAdForm(false)} className="px-4 py-2.5 rounded-xl border border-[#1e1e35] text-[#606080] hover:text-white text-sm transition-colors">
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: A/B Test Form ── */}
      {showAbForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#1e1e35]">
              <h3 className="text-sm font-semibold text-white">Yeni A/B Test Başlat</h3>
              <button onClick={() => setShowAbForm(false)} className="text-[#606080] hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={LABEL}>Reklam Alanı</label>
                <select className={INPUT} value={abForm.zoneId} onChange={(e) => setAbForm((f) => ({ ...f, zoneId: e.target.value }))}>
                  <option value="">Alan seçin...</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>A Grubu Reklamı</label>
                <select className={INPUT} value={abForm.adAId} onChange={(e) => setAbForm((f) => ({ ...f, adAId: e.target.value }))}>
                  <option value="">Reklam seçin...</option>
                  {ads.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>B Grubu Reklamı</label>
                <select className={INPUT} value={abForm.adBId} onChange={(e) => setAbForm((f) => ({ ...f, adBId: e.target.value }))}>
                  <option value="">Reklam seçin...</option>
                  {ads.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <p className="text-xs text-[#606080]">Ziyaretçilere %50/%50 dağıtım yapılır. Cookie ile aynı grup gösterilir.</p>
              <div className="flex items-center gap-3">
                <button onClick={startAbTest} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors">
                  <Zap size={14} /> Testi Başlat
                </button>
                <button onClick={() => setShowAbForm(false)} className="px-4 py-2.5 rounded-xl border border-[#1e1e35] text-[#606080] hover:text-white text-sm transition-colors">İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
