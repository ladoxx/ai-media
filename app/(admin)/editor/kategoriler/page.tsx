import { prisma } from '@/lib/db'

const CATEGORY_COLORS: Record<string, string> = {
  teknoloji: '#00c896',
  kripto: '#f7931a',
  gayrimenkul: '#3b82f6',
  oyun: '#a855f7',
}

function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug?.toLowerCase()] ?? '#606080'
}

export default async function EditorKategorilerPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Kategoriler</h1>
        <p className="text-[#606080] text-sm mt-0.5">{categories.length} kategori</p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-sm">
        <span className="text-yellow-400 mt-0.5 shrink-0">⚠️</span>
        <p className="text-yellow-300/80">
          Kategori ekleme/silme işlemleri SuperAdmin yetkisi gerektirir.
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e35]">
                <th className="text-left px-5 py-3.5 text-[#606080] font-medium text-xs uppercase tracking-wider">
                  İsim
                </th>
                <th className="text-left px-5 py-3.5 text-[#606080] font-medium text-xs uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-5 py-3.5 text-[#606080] font-medium text-xs uppercase tracking-wider">
                  İkon
                </th>
                <th className="text-left px-5 py-3.5 text-[#606080] font-medium text-xs uppercase tracking-wider">
                  Renk
                </th>
                <th className="text-left px-5 py-3.5 text-[#606080] font-medium text-xs uppercase tracking-wider">
                  Yazı Sayısı
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#606080] text-sm">
                    Kategori bulunamadı.
                  </td>
                </tr>
              )}
              {categories.map((cat) => {
                const color = getCategoryColor(cat.slug)
                return (
                  <tr
                    key={cat.id}
                    className="border-b border-[#1e1e35] last:border-0 hover:bg-[#0a0a14]/40 transition-colors"
                  >
                    {/* İsim */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-[#f0f0fa]">{cat.name}</span>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-5 py-4">
                      <code className="text-xs font-mono bg-[#0a0a14] border border-[#1e1e35] rounded px-2 py-0.5 text-[#606080]">
                        {cat.slug}
                      </code>
                    </td>

                    {/* İkon */}
                    <td className="px-5 py-4">
                      <span className="text-xl">{cat.icon}</span>
                    </td>

                    {/* Renk */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md border border-[#1e1e35] shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <code className="text-xs font-mono text-[#606080]">{color}</code>
                      </div>
                    </td>

                    {/* Yazı Sayısı */}
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                        }}
                      >
                        {cat._count.posts}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
