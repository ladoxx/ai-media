import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'

export default async function EditorDashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const totalPosts = await prisma.post.count({ where: { authorId: userId } })
  const draftPosts = await prisma.post.count({ where: { authorId: userId, status: 'DRAFT' } })

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthlyViewsResult = await prisma.post.aggregate({
    where: { authorId: userId, publishedAt: { gte: thisMonth } },
    _sum: { views: true },
  })
  const monthlyViews = monthlyViewsResult._sum.views ?? 0

  const recentPosts = await prisma.post.findMany({
    where: { authorId: userId },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })

  const topPosts = await prisma.post.findMany({
    where: { authorId: userId, status: 'PUBLISHED' },
    take: 5,
    orderBy: { views: 'desc' },
  })

  const todayFormatted = format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })

  const statusBadge = (status: string) => {
    if (status === 'PUBLISHED')
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#00c896]/10 text-[#00c896]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] inline-block" />
          Yayında
        </span>
      )
    if (status === 'DRAFT')
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
          Taslak
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#606080]/10 text-[#606080]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#606080] inline-block" />
        Arşiv
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6 space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold">
          Merhaba, {session?.user?.name} 👋
        </h1>
        <p className="text-[#606080] text-sm">{todayFormatted} — Bugün ne yazıyoruz?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 flex flex-col gap-2">
          <span className="text-2xl">📝</span>
          <p className="text-[#606080] text-xs uppercase tracking-wider font-medium">Toplam Yazı</p>
          <p className="text-3xl font-bold font-display">{totalPosts}</p>
        </div>
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 flex flex-col gap-2">
          <span className="text-2xl">👁</span>
          <p className="text-[#606080] text-xs uppercase tracking-wider font-medium">Bu Ay Görüntülenme</p>
          <p className="text-3xl font-bold font-display">{monthlyViews.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 flex flex-col gap-2">
          <span className="text-2xl">📄</span>
          <p className="text-[#606080] text-xs uppercase tracking-wider font-medium">Taslak Yazılar</p>
          <p className="text-3xl font-bold font-display">{draftPosts}</p>
        </div>
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 flex flex-col gap-2">
          <span className="text-2xl">💬</span>
          <p className="text-[#606080] text-xs uppercase tracking-wider font-medium">Bekleyen Yorum</p>
          <p className="text-3xl font-bold font-display">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/editor/yazilar/yeni"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#00c896] text-black font-semibold text-sm hover:bg-[#00b386] transition-colors"
        >
          <span className="text-lg">+</span>
          Yeni Yazı Yaz
        </Link>
        <Link
          href="/editor/yazilar?durum=DRAFT"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-[#1e1e35] text-[#f0f0fa] font-semibold text-sm hover:border-[#606080] hover:bg-[#16162a] transition-colors"
        >
          <span>📋</span>
          Taslakları Görüntüle
        </Link>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Yazılar */}
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e35] flex items-center justify-between">
            <h2 className="font-display font-semibold text-base">Son Yazılar</h2>
            <Link href="/editor/yazilar" className="text-[#00c896] text-xs hover:underline">
              Tümünü Gör →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">Başlık</th>
                  <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">Durum</th>
                  <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider hidden md:table-cell">Tarih</th>
                  <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#606080] text-sm">
                      Henüz yazı yok.
                    </td>
                  </tr>
                )}
                {recentPosts.map((post) => (
                  <tr key={post.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#0a0a14]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[#f0f0fa] font-medium line-clamp-1 max-w-[140px] block">
                        {post.title.length > 30 ? post.title.slice(0, 30) + '…' : post.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[#606080] text-xs">{(post.category as any)?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(post.status)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[#606080] text-xs">
                        {format(new Date(post.createdAt), 'd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/editor/yazilar/${post.id}`}
                        className="text-[#00c896] text-xs hover:underline font-medium"
                      >
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* En Çok Okunanlar */}
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e35]">
            <h2 className="font-display font-semibold text-base">En Çok Okunanlar</h2>
          </div>
          <div className="divide-y divide-[#1e1e35]">
            {topPosts.length === 0 && (
              <div className="px-5 py-8 text-center text-[#606080] text-sm">
                Henüz yayınlanan yazı yok.
              </div>
            )}
            {topPosts.map((post, index) => (
              <div key={post.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#0a0a14]/50 transition-colors">
                <span className="text-[#606080] font-display font-bold text-lg w-6 shrink-0 text-center">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-[#f0f0fa] font-medium line-clamp-2">
                  {post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}
                </span>
                <span className="text-[#606080] text-xs flex items-center gap-1 shrink-0">
                  👁 {post.views.toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
