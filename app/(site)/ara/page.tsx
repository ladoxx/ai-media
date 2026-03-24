'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NewsCard } from '@/components/site/NewsCard'
import { Badge } from '@/components/ui/Badge'
import { Search } from 'lucide-react'

const CATEGORIES = [
  { slug: 'teknoloji', color: 'tech',   label: 'Teknoloji', icon: '💻' },
  { slug: 'kripto',    color: 'crypto', label: 'Kripto',    icon: '₿'  },
  { slug: 'gayrimenkul', color: 'real', label: 'Gayrimenkul', icon: '🏠' },
  { slug: 'oyun',      color: 'game',  label: 'Oyun',      icon: '🎮' },
]

function AraContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') ?? ''
  const kat = searchParams.get('kategori') ?? ''

  const [query, setQuery] = useState(q)
  const [selectedKat, setSelectedKat] = useState(kat)
  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    const params = new URLSearchParams({ q, ...(kat ? { kategori: kat } : {}) })
    fetch(`/api/ara?${params}`)
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts ?? []); setTotal(data.total ?? 0) })
      .finally(() => setLoading(false))
  }, [q, kat])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ q: query, ...(selectedKat ? { kategori: selectedKat } : {}) })
    router.push(`/ara?${params}`)
  }

  function handleKatFilter(slug: string) {
    const next = selectedKat === slug ? '' : slug
    setSelectedKat(next)
    const params = new URLSearchParams({ q, ...(next ? { kategori: next } : {}) })
    router.push(`/ara?${params}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Box */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-2xl text-[var(--text-primary)] mb-4">
          🔍 Haber Ara
        </h1>
        <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Aramak istediğiniz konuyu yazın..."
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech transition-colors"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-3 bg-accent-tech text-dark-bg font-semibold rounded-xl hover:bg-accent-tech/90 transition-colors"
          >
            <Search className="w-4 h-4" /> Ara
          </button>
        </form>
      </div>

      {/* Category Filters */}
      {q && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-[var(--text-muted)]">Filtrele:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleKatFilter(cat.slug)}
              className={`transition-all rounded-full ${selectedKat === cat.slug ? 'ring-2 ring-accent-tech' : 'opacity-70 hover:opacity-100'}`}
            >
              <Badge category={cat.color} name={cat.label} icon={cat.icon} size="sm" />
            </button>
          ))}
          {selectedKat && (
            <button onClick={() => handleKatFilter('')} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors ml-2">
              × Filtreyi kaldır
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {q && (
        <div className="mb-4">
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? 'Aranıyor...' : (
              <>
                <span className="font-semibold text-[var(--text-primary)]">{total}</span> sonuç bulundu:
                <span className="text-accent-tech font-semibold"> "{q}"</span>
              </>
            )}
          </p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-64 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => <NewsCard key={post.id} post={post} variant="default" />)}
        </div>
      )}

      {!loading && q && posts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Sonuç Bulunamadı</h2>
          <p className="text-[var(--text-muted)]">
            "<span className="text-accent-tech">{q}</span>" için sonuç bulunamadı.
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Farklı anahtar kelimeler deneyebilirsiniz.</p>
        </div>
      )}

      {!q && (
        <div className="py-20 text-center">
          <p className="text-6xl mb-4">🧭</p>
          <p className="text-[var(--text-muted)]">Aramak istediğiniz konuyu girin.</p>
        </div>
      )}
    </div>
  )
}

export default function AraPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Yükleniyor...</div>}>
      <AraContent />
    </Suspense>
  )
}
