import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { StatsCard } from '@/components/admin/StatsCard'
import { SuperAdminCharts } from '@/components/admin/SuperAdminCharts'

export const dynamic = 'force-dynamic'

// CSS class → hex dönüşümü
const CAT_COLOR_HEX: Record<string, string> = {
  'cat-finans':       '#f7931a',
  'cat-ekonomi':      '#3b82f6',
  'cat-gayrimenkul':  '#10b981',
  'cat-oyun':         '#a855f7',
  'cat-teknoloji':    '#00c896',
  'cat-rehber':       '#f59e0b',
  'cat-son-dakika':   '#ef4444',
  'cat-trend':        '#ec4899',
  // Eski sistem fallback
  'tech':   '#00c896',
  'crypto': '#f7931a',
  'real':   '#3b82f6',
  'game':   '#a855f7',
}

const DEFAULT_COLORS = [
  '#f7931a', '#00c896', '#3b82f6', '#a855f7', '#ef4444',
  '#eab308', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
]

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    success: { bg: 'bg-[#00c896]/15', text: 'text-[#00c896]', label: 'Başarılı' },
    error:   { bg: 'bg-red-400/15',   text: 'text-red-400',   label: 'Hata'    },
    warning: { bg: 'bg-yellow-400/15',text: 'text-yellow-400',label: 'Uyarı'   },
    info:    { bg: 'bg-blue-400/15',  text: 'text-blue-400',  label: 'Bilgi'   },
  }
  const s = map[status?.toLowerCase()] ?? map.info
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') {
    redirect('/login')
  }

  // ─── Data fetching ────────────────────────────────────────────────────────
  const [
    totalPosts,
    totalUsers,
    totalSubscribers,
    totalViewsAgg,
    totalAffiliateClicksAgg,
    apiKeys,
    recentLogs,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.subscriber.count({ where: { active: true } }),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.affiliateLink.aggregate({ _sum: { clicks: true } }),
    prisma.apiKey.findMany(),
    prisma.autoLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
  ])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [recentPosts, categoriesRaw] = await Promise.all([
    prisma.post.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
    }),
  ])

  // ─── Posts per day (last 30) ──────────────────────────────────────────────
  const dayMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[format(d, 'dd.MM')] = 0
  }
  for (const post of recentPosts) {
    const key = format(new Date(post.createdAt), 'dd.MM')
    if (key in dayMap) dayMap[key]++
  }
  const postsPerDay = Object.entries(dayMap).map(([day, count]) => ({ day, count }))

  // ─── Category data ────────────────────────────────────────────────────────
  const categoryData = categoriesRaw.map((cat, idx) => ({
    name: cat.name,
    count: cat._count.posts,
    color: CAT_COLOR_HEX[cat.color] ?? CAT_COLOR_HEX[cat.slug] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  })).filter(c => c.count > 0)

  // ─── API key map ──────────────────────────────────────────────────────────
  const keyMap = Object.fromEntries(apiKeys.map(k => [k.name, k]))

  const serviceRows = [
    { name: 'GEMINI_API_KEY',  label: 'Gemini API'    },
    { name: 'YOUTUBE_API_KEY', label: 'YouTube API'   },
    { name: 'TELEGRAM_TOKEN',  label: 'Telegram'      },
    { name: 'NEWSAPI_KEY',     label: 'NewsAPI'        },
    { name: 'REDDIT_CLIENT_ID',label: 'Reddit'        },
  ]

  const totalViews = totalViewsAgg._sum.views ?? 0
  const totalClicks = totalAffiliateClicksAgg._sum.clicks ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-[#f7931a]">Super</span>Admin Paneli
          </h1>
          <p className="text-sm text-[#606080] mt-0.5">
            Hoş geldin, {session.user?.name ?? session.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f7931a]/10 border border-[#f7931a]/20">
          <span className="w-2 h-2 rounded-full bg-[#f7931a] animate-pulse" />
          <span className="text-xs font-medium text-[#f7931a]">SUPERADMIN</span>
        </div>
      </div>

      {/* [1] Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          icon="📝"
          label="Toplam Yazı"
          value={totalPosts.toLocaleString('tr-TR')}
          accent="#f7931a"
        />
        <StatsCard
          icon="👥"
          label="Kullanıcılar"
          value={totalUsers.toLocaleString('tr-TR')}
          accent="#f7931a"
        />
        <StatsCard
          icon="📬"
          label="Aktif Abone"
          value={totalSubscribers.toLocaleString('tr-TR')}
          accent="#f7931a"
        />
        <StatsCard
          icon="👁"
          label="Toplam Görüntülenme"
          value={totalViews.toLocaleString('tr-TR')}
          accent="#f7931a"
        />
        <StatsCard
          icon="🔗"
          label="Affiliate Tıklama"
          value={totalClicks.toLocaleString('tr-TR')}
          accent="#f7931a"
        />
        <StatsCard
          icon="💰"
          label="Tahmini Gelir"
          value="$0"
          accent="#f7931a"
          muted
        />
      </div>

      {/* [2] Charts */}
      <SuperAdminCharts postsPerDay={postsPerDay} categoryData={categoryData} />

      {/* [3] System Status */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#f0f0fa]">Sistem Durumu</h2>
          <Link
            href="/superadmin/api-keys"
            className="text-xs text-[#f7931a] hover:underline"
          >
            Tümünü Yönet →
          </Link>
        </div>
        <div className="divide-y divide-[#1e1e35]">
          {serviceRows.map((service) => {
            const key = keyMap[service.name]
            const hasValue = !!key?.value
            return (
              <div key={service.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      hasValue ? 'bg-[#00c896]' : 'bg-red-400'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-[#f0f0fa]">{service.label}</p>
                    <p className="text-xs text-[#606080]">
                      {hasValue ? 'Anahtar tanımlı' : 'Ayarlanmamış'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/superadmin/api-keys"
                  className="text-xs px-3 py-1.5 border border-[#1e1e35] rounded-lg text-[#606080] hover:text-[#f7931a] hover:border-[#f7931a]/30 transition-colors"
                >
                  Test Et
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* [4] Son Aktiviteler */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35]">
          <h2 className="text-sm font-semibold text-[#f0f0fa]">Son Aktiviteler</h2>
          <p className="text-xs text-[#606080] mt-0.5">Son 10 otomasyon kaydı</p>
        </div>
        {recentLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#606080]">
            Henüz kayıt yok
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#606080] border-b border-[#1e1e35]">
                  <th className="px-5 py-3 text-left font-medium">Tarih</th>
                  <th className="px-5 py-3 text-left font-medium">Tip</th>
                  <th className="px-5 py-3 text-left font-medium">Durum</th>
                  <th className="px-5 py-3 text-left font-medium">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1e1e35]/40 transition-colors">
                    <td className="px-5 py-3 text-[#606080] whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-[#0a0a14] border border-[#1e1e35] rounded px-2 py-0.5 text-[#f0f0fa]">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">{statusBadge(log.status)}</td>
                    <td className="px-5 py-3 text-[#606080] max-w-xs">
                      <span title={log.message}>
                        {log.message.length > 60
                          ? log.message.slice(0, 60) + '…'
                          : log.message}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* [5] Hızlı Eylemler */}
      <div>
        <h2 className="text-sm font-semibold text-[#f0f0fa] mb-3">Hızlı Eylemler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🤖', title: 'Otomasyonu Başlat', desc: 'AI içerik üretimi ve paylaşım', href: '/superadmin/otomasyon' },
            { icon: '👤', title: 'Kullanıcı Ekle',    desc: 'Yeni editör veya admin ekle',   href: '/superadmin/kullanicilar' },
            { icon: '📊', title: 'API Keys',          desc: 'Servis anahtarlarını yönet',    href: '/superadmin/api-keys' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-[#16162a] border border-[#1e1e35] hover:border-[#f7931a]/40 rounded-xl p-5 transition-all hover:bg-[#1a1a2e]"
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="text-sm font-semibold text-[#f0f0fa] group-hover:text-[#f7931a] transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-[#606080] mt-1">{action.desc}</p>
              <div className="mt-4 text-xs text-[#f7931a] opacity-0 group-hover:opacity-100 transition-opacity">
                Gitmek için tıkla →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
