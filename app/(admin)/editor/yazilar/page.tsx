'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

type Post = {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  views: number
  createdAt: string
  category: { id: string; name: string; color: string; slug: string } | null
}

type ApiResponse = {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

const CATEGORY_COLORS: Record<string, string> = {
  teknoloji: '#00c896',
  kripto: '#f7931a',
  gayrimenkul: '#3b82f6',
  oyun: '#a855f7',
}

function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug?.toLowerCase()] ?? '#606080'
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED')
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c896]/10 text-[#00c896]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] inline-block" />
        Yayında
      </span>
    )
  if (status === 'DRAFT')
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
        Taslak
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#606080]/10 text-[#606080]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#606080] inline-block" />
      Arşiv
    </span>
  )
}

export default function EditorYazilarPage() {
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('')
  const [durumFilter, setDurumFilter] = useState('')
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [kategoriler, setKategoriler] = useState<{ id: string; name: string; slug: string }[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  // Read initial durum from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const durum = params.get('durum')
    if (durum) setDurumFilter(durum)
  }, [])

  // Fetch categories once
  useEffect(() => {
    fetch('/api/kategoriler')
      .then((r) => r.json())
      .then((data) => setKategoriler(Array.isArray(data) ? data : data.categories ?? []))
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      qs.set('limit', '20')
      qs.set('sayfa', String(page))
      if (durumFilter) qs.set('status', durumFilter)
      if (search) qs.set('search', search)
      if (kategoriFilter) qs.set('category', kategoriFilter)

      const res = await fetch(`/api/admin/yazilar?${qs.toString()}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data: ApiResponse = await res.json()
      setPosts(data.posts ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [page, durumFilter, search, kategoriFilter])

  useEffect(() => {
    setPage(1)
  }, [durumFilter, search, kategoriFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/yazilar/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchPosts()
        setSelectedIds((prev) => prev.filter((sid) => sid !== id))
      } else {
        alert('Silme işlemi başarısız oldu.')
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`${selectedIds.length} yazıyı silmek istediğinize emin misiniz?`)) return
    for (const id of selectedIds) {
      await fetch(`/api/admin/yazilar/${id}`, { method: 'DELETE' })
    }
    setSelectedIds([])
    await fetchPosts()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === posts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(posts.map((p) => p.id))
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] text-sm'

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Yazılar</h1>
          <p className="text-[#606080] text-sm mt-0.5">{total} yazı bulundu</p>
        </div>
        <Link
          href="/editor/yazilar/yeni"
          className="px-4 py-2.5 rounded-lg bg-[#00c896] text-black font-semibold text-sm hover:bg-[#00b386] transition-colors flex items-center gap-2"
        >
          <span>+</span> Yeni Yazı
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Yazı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} sm:w-64`}
        />
        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          className={`${inputCls} sm:w-48`}
        >
          <option value="">Tüm Kategoriler</option>
          {kategoriler.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <select
          value={durumFilter}
          onChange={(e) => setDurumFilter(e.target.value)}
          className={`${inputCls} sm:w-44`}
        >
          <option value="">Tümü</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="DRAFT">Taslak</option>
          <option value="ARCHIVED">Arşiv</option>
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-[#16162a] border border-[#1e1e35] rounded-lg">
          <span className="text-sm text-[#f0f0fa] font-medium">{selectedIds.length} yazı seçildi</span>
          <span className="text-[#1e1e35]">|</span>
          <button
            onClick={handleBulkDelete}
            className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Toplu Sil
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-[#606080] hover:text-[#f0f0fa] ml-auto transition-colors"
          >
            İptal
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e35]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={posts.length > 0 && selectedIds.length === posts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#1e1e35] bg-[#0a0a14] accent-[#00c896]"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider w-8">#</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">Başlık</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider hidden md:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">Durum</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Görüntülenme</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Tarih</th>
                <th className="text-left px-4 py-3 text-[#606080] font-medium text-xs uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#606080] text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
                      Yükleniyor...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && posts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#606080] text-sm">
                    Yazı bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                posts.map((post, index) => {
                  const catSlug = post.category?.slug ?? ''
                  const catColor = getCategoryColor(catSlug)
                  const rowNum = (page - 1) * 20 + index + 1
                  return (
                    <tr
                      key={post.id}
                      className="border-b border-[#1e1e35] last:border-0 hover:bg-[#0a0a14]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="w-4 h-4 rounded border-[#1e1e35] bg-[#0a0a14] accent-[#00c896]"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#606080] text-xs">{rowNum}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <Link
                          href={`/editor/yazilar/${post.id}`}
                          className="text-[#f0f0fa] font-medium hover:text-[#00c896] transition-colors line-clamp-1"
                        >
                          {post.title.length > 50 ? post.title.slice(0, 50) + '…' : post.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {post.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                            style={{ color: catColor }}
                          >
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: catColor }}
                            />
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-[#606080] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[#606080] text-xs flex items-center gap-1">
                          👁 {post.views.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[#606080] text-xs">
                          {format(new Date(post.createdAt), 'd MMM yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/editor/yazilar/${post.id}`}
                            className="text-[#00c896] hover:text-[#00b386] transition-colors"
                            title="Düzenle"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title="Sil"
                          >
                            {deleting === post.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              '🗑️'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-[#1e1e35] text-sm text-[#f0f0fa] hover:border-[#606080] hover:bg-[#16162a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Önceki
          </button>
          <span className="text-sm text-[#606080]">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-[#1e1e35] text-sm text-[#f0f0fa] hover:border-[#606080] hover:bg-[#16162a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  )
}
