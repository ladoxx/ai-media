'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import slugify from 'slugify'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { SEOPanel } from '@/components/editor/SEOPanel'
import { ConfirmModal } from '@/components/ui/Modal'
import { TagInput } from '@/components/editor/TagInput'
import { Save, X, Trash2, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Category {
  id: string
  name: string
  slug: string
}

const inputBase =
  'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] text-sm'

export default function EditYaziPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  useSession()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [categoryId, setCategoryId] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [readTime, setReadTime] = useState(5)
  const [slug, setSlug] = useState('')
  const [slugLocked, setSlugLocked] = useState(true)

  // SEO
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load post + categories in parallel
  useEffect(() => {
    const loadAll = async () => {
      setFetching(true)
      try {
        const [postRes, catRes] = await Promise.all([
          fetch(`/api/admin/yazilar/${id}`),
          fetch('/api/kategoriler'),
        ])

        if (!postRes.ok) throw new Error(`HTTP ${postRes.status}`)

        const [post, catData] = await Promise.all([postRes.json(), catRes.json()])

        setTitle(post.title ?? '')
        setContent(post.content ?? '')
        setExcerpt(post.excerpt ?? '')
        setStatus(post.status ?? 'DRAFT')
        setCategoryId(post.categoryId ?? '')
        setCoverImage(post.coverImage ?? '')
        setTags(Array.isArray(post.tags) ? post.tags.map((t: { name?: string } | string) => (typeof t === 'string' ? t : t.name ?? '')) : [])
        setReadTime(post.readTime ?? 5)
        setSlug(post.slug ?? '')
        setSeoTitle(post.seoTitle ?? '')
        setSeoDesc(post.seoDesc ?? '')

        setCategories(Array.isArray(catData) ? catData : catData.kategoriler ?? [])
      } catch {
        setMessage({ type: 'error', text: 'Yazı yüklenemedi.' })
      } finally {
        setFetching(false)
      }
    }

    loadAll()
  }, [id])

  const generatedSlug = slugLocked
    ? slug
    : slugify(title, { lower: true, strict: true, locale: 'tr' })

  const handleSEOChange = useCallback((field: string, value: string) => {
    if (field === 'seoTitle') setSeoTitle(value)
    else if (field === 'seoDesc') setSeoDesc(value)
    else if (field === 'focusKeyword') setFocusKeyword(value)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Başlık zorunludur.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/yazilar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: generatedSlug,
          content,
          excerpt,
          categoryId: categoryId || undefined,
          tagNames: tags,
          readTime,
          status,
          coverImage: coverImage || undefined,
          seoTitle: seoTitle || title,
          seoDesc,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? `HTTP ${res.status}`)
      }

      setMessage({ type: 'success', text: 'Değişiklikler kaydedildi.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/yazilar/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDeleteModalOpen(false)
      router.push('/editor/yazilar')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Silme başarısız.' })
      setDeleteModalOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#606080] text-sm">Yazı yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-[#16162a] border-b border-[#1e1e35]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/editor/yazilar')}
            className="text-[#606080] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-semibold text-sm truncate max-w-xs">
            {title || 'Yazı Düzenle'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/60 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            Sil
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg hover:bg-[#00c896]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={15} />
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-0 max-w-[1400px] mx-auto">
        {/* Left: Title + Editor */}
        <div className="flex-1 min-w-0 px-8 py-6">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugLocked) {
                setSlug(slugify(e.target.value, { lower: true, strict: true, locale: 'tr' }))
              }
            }}
            placeholder="Yazı başlığı..."
            className="w-full bg-transparent border-none outline-none text-white text-3xl font-bold placeholder-[#1e1e35] mb-4 leading-tight"
          />

          {/* Slug editor */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-[#606080]">Slug:</span>
            {slugLocked ? (
              <>
                <span className="text-xs text-[#00c896] font-mono">{generatedSlug}</span>
                <button
                  type="button"
                  onClick={() => setSlugLocked(false)}
                  className="text-xs text-[#606080] hover:text-white underline transition-colors cursor-pointer"
                >
                  Düzenle
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(slugify(e.target.value, { lower: true, strict: true, locale: 'tr' }))
                  }
                  className="text-xs font-mono bg-[#0a0a14] border border-[#1e1e35] text-[#00c896] px-2 py-1 rounded focus:outline-none focus:border-[#00c896]"
                />
                <button
                  type="button"
                  onClick={() => setSlugLocked(true)}
                  className="text-xs text-[#606080] hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              </>
            )}
          </div>

          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Yazınızı buraya girin..."
          />
        </div>

        {/* Right: Sidebar */}
        <aside className="w-72 shrink-0 border-l border-[#1e1e35] bg-[#16162a] min-h-[calc(100vh-57px)] px-4 py-5 overflow-y-auto space-y-5">
          {/* Save button (sidebar) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full py-2.5 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg hover:bg-[#00c896]/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
              className={inputBase}
            >
              <option value="DRAFT">Taslak</option>
              <option value="PUBLISHED">Yayında</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputBase}
            >
              <option value="">Kategori seçin...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Read Time */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Okuma Süresi (dk)
            </label>
            <input
              type="number"
              value={readTime}
              onChange={(e) => setReadTime(Number(e.target.value))}
              min={1}
              max={60}
              className={inputBase}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Kapak Görseli URL
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className={inputBase}
            />
            {coverImage && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[#1e1e35]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Kapak görseli önizlemesi"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Etiketler
            </label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">
              Özet
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Kısa özet..."
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[#1e1e35]" />

          {/* SEO Panel */}
          <SEOPanel
            title={title}
            content={content}
            slug={generatedSlug}
            seoTitle={seoTitle}
            seoDesc={seoDesc}
            focusKeyword={focusKeyword}
            onChange={handleSEOChange}
          />

          {/* Danger zone */}
          <div className="border-t border-[#1e1e35] pt-4">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="w-full py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Yazıyı Sil
            </button>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Yazıyı Sil"
        message={`"${title}" başlıklı yazıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        danger
        loading={deleting}
      />
    </div>
  )
}
