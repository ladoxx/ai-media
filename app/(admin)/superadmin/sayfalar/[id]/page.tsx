'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Eye, Globe, EyeOff } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Modal'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Revision {
  id: string
  createdAt: string
  createdBy: string
}

interface PageData {
  id: string
  title: string
  slug: string
  content: string
  status: string
  template: string
  showInMenu: boolean
  menuOrder: number
  seoTitle: string | null
  seoDesc: string | null
  publishedAt: string | null
  updatedAt: string
  revisions?: Revision[]
}

const TEMPLATES = [
  { id: 'default', label: '📄 Standart Sayfa' },
  { id: 'legal', label: '⚖️ Yasal Metin' },
  { id: 'contact', label: '📬 İletişim' },
  { id: 'about', label: '🧭 Hakkımızda' },
  { id: 'advertising', label: '📢 Reklam / Medya Kiti' },
  { id: 'landing', label: '🚀 Landing Page' },
  { id: 'blank', label: '⬜ Boş (Tam Özel)' },
]

const inputBase =
  'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm'

const cardClass = 'bg-[#16162a] border border-[#1e1e35] rounded-xl p-4'
const labelClass = 'block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5'

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    PUBLISHED: { label: 'Yayında', color: '#00c896', bg: 'rgba(0,200,150,0.12)' },
    DRAFT: { label: 'Taslak', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    ARCHIVED: { label: 'Arşiv', color: '#606080', bg: 'rgba(96,96,128,0.12)' },
  }
  const cfg = configs[status] ?? configs.ARCHIVED
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SayfaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()

  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditing, setSlugEditing] = useState(false)
  const [content, setContent] = useState('')
  const [template, setTemplate] = useState('default')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT')
  const [showInMenu, setShowInMenu] = useState(false)
  const [menuOrder, setMenuOrder] = useState(0)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [revisions, setRevisions] = useState<Revision[]>([])

  // Restore confirm
  const [restoreTarget, setRestoreTarget] = useState<Revision | null>(null)
  const [restoring, setRestoring] = useState(false)

  const slugInputRef = useRef<HTMLInputElement>(null)

  async function fetchPage() {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/sayfalar/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PageData = await res.json()
      setPage(data)
      setTitle(data.title)
      setSlug(data.slug)
      setContent(data.content ?? '')
      setTemplate(data.template ?? 'default')
      setStatus((data.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') ?? 'DRAFT')
      setShowInMenu(data.showInMenu ?? false)
      setMenuOrder(data.menuOrder ?? 0)
      setSeoTitle(data.seoTitle ?? '')
      setSeoDesc(data.seoDesc ?? '')
      setRevisions(data.revisions?.slice(0, 5) ?? [])
    } catch {
      toast.error('Sayfa yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave(publishStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (!title.trim()) {
      toast.error('Başlık zorunludur.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/sayfalar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          slug: slug || slugify(title),
          template,
          status: publishStatus ?? status,
          showInMenu,
          menuOrder,
          seoTitle: seoTitle || undefined,
          seoDesc: seoDesc || undefined,
          saveRevision: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
      }

      if (publishStatus) setStatus(publishStatus)
      toast.success('Sayfa kaydedildi.')
      await fetchPage()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      const res = await fetch(`/api/superadmin/sayfalar/${id}/revizyon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: restoreTarget.id }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Revizyon geri yüklendi.')
      setRestoreTarget(null)
      await fetchPage()
    } catch {
      toast.error('Revizyon geri yüklenemedi.')
    } finally {
      setRestoring(false)
    }
  }

  function enableSlugEdit() {
    setSlugEditing(true)
    setTimeout(() => slugInputRef.current?.focus(), 50)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center text-[#606080]">
        <Loader2 size={28} className="animate-spin mr-2" />
        <span>Yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-[#16162a] border-b border-[#1e1e35]">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-sm truncate max-w-xs">{title || 'Sayfa Düzenle'}</h1>
          {page && <StatusBadge status={status} />}
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-[#606080]">
              <Loader2 size={14} className="animate-spin" />
              Kaydediliyor...
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-white font-semibold text-sm rounded-lg hover:bg-[#f7931a]/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            Kaydet
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-0 max-w-[1400px] mx-auto">
        {/* LEFT */}
        <div className="flex-1 min-w-0 px-8 py-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sayfa başlığını girin"
            className="w-full bg-transparent border-none outline-none text-white text-3xl font-bold placeholder-[#1e1e35] mb-4 leading-tight"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            {slugEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-[#606080]">/</span>
                <input
                  ref={slugInputRef}
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  onBlur={() => setSlugEditing(false)}
                  className="bg-[#0a0a14] border border-[#f7931a] rounded px-2 py-0.5 text-white text-sm font-mono focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[#606080] font-mono">/{slug || slugify(title)}</span>
                <button
                  type="button"
                  onClick={enableSlugEdit}
                  className="text-xs text-[#606080] hover:text-[#f7931a] transition-colors cursor-pointer"
                >
                  ✏️ Düzenle
                </button>
              </div>
            )}
          </div>

          {/* TipTap editor */}
          <TipTapEditor
            content={content}
            onChange={(html) => setContent(html)}
            placeholder="Sayfa içeriğini buraya girin..."
          />
        </div>

        {/* RIGHT sidebar */}
        <aside className="w-72 shrink-0 border-l border-[#1e1e35] bg-[#16162a] min-h-[calc(100vh-57px)] px-4 py-5 overflow-y-auto space-y-4">
          {/* Card 1 — Actions */}
          <div className={cardClass}>
            <p className={labelClass}>Eylemler</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
                className="w-full py-2.5 bg-[#1e1e35] text-[#606080] hover:text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Taslak Kaydet
              </button>
              <button
                type="button"
                onClick={() => handleSave('PUBLISHED')}
                disabled={saving}
                className="w-full py-2.5 bg-[#f7931a] text-white font-semibold text-sm rounded-lg hover:bg-[#f7931a]/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Kaydediliyor...
                  </span>
                ) : (
                  '🚀 Yayınla'
                )}
              </button>
              <a
                href={`/preview/${id}?token=preview-secret-2024`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 border border-[#1e1e35] text-[#606080] hover:text-white hover:border-[#606080] font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={14} />
                👁 Önizle
              </a>
            </div>

            {page?.updatedAt && (
              <p className="text-xs text-[#606080] mt-3 pt-3 border-t border-[#1e1e35]">
                Son güncelleme: {format(new Date(page.updatedAt), 'dd MMM yyyy HH:mm')}
              </p>
            )}
          </div>

          {/* Card 2 — Sayfa Ayarları */}
          <div className={cardClass}>
            <p className={labelClass}>Sayfa Ayarları</p>
            <div className="space-y-3">
              {/* Status */}
              <div>
                <label className={labelClass}>Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                  className={inputBase}
                >
                  <option value="DRAFT">Taslak</option>
                  <option value="PUBLISHED">Yayında</option>
                  <option value="ARCHIVED">Arşiv</option>
                </select>
              </div>

              {/* Template */}
              <div>
                <label className={labelClass}>Şablon</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className={inputBase}
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show in menu toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#606080]">Menüde Göster</span>
                <button
                  type="button"
                  onClick={() => setShowInMenu((v) => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    showInMenu ? 'bg-[#f7931a]' : 'bg-[#1e1e35]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      showInMenu ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Menu order (conditional) */}
              {showInMenu && (
                <div>
                  <label className={labelClass}>Menü Sırası</label>
                  <input
                    type="number"
                    value={menuOrder}
                    onChange={(e) => setMenuOrder(Number(e.target.value))}
                    min={0}
                    className={inputBase}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 3 — SEO */}
          <div className={cardClass}>
            <p className={labelClass}>SEO</p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass} style={{ marginBottom: 0 }}>SEO Başlığı</label>
                  <span className={`text-xs ${seoTitle.length > 60 ? 'text-red-400' : 'text-[#606080]'}`}>
                    {seoTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'SEO başlığı...'}
                  className={inputBase}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass} style={{ marginBottom: 0 }}>Meta Açıklama</label>
                  <span className={`text-xs ${seoDesc.length > 155 ? 'text-red-400' : 'text-[#606080]'}`}>
                    {seoDesc.length}/155
                  </span>
                </div>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  placeholder="Sayfa açıklaması..."
                  rows={3}
                  className={`${inputBase} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Card 4 — Revizyon Geçmişi */}
          {revisions.length > 0 && (
            <div className={cardClass}>
              <p className={labelClass}>Revizyon Geçmişi</p>
              <div className="space-y-2">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-start justify-between gap-2 py-2 border-b border-[#1e1e35] last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[#606080] truncate">
                        🕐{' '}
                        {formatDistanceToNow(new Date(rev.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                      <p className="text-xs text-[#606080] truncate mt-0.5">
                        {rev.createdBy}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(rev)}
                      className="shrink-0 text-xs px-2 py-1 bg-[#0a0a14] border border-[#1e1e35] text-[#606080] hover:text-white hover:border-[#f7931a] rounded-lg transition-colors cursor-pointer"
                    >
                      Geri Yükle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Restore Confirm Modal */}
      <ConfirmModal
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Revizyonu Geri Yükle"
        message="Bu revizyonu geri yüklemek istediğinize emin misiniz? Mevcut içerik kaydedilmeden değiştirilecektir."
        confirmLabel="Geri Yükle"
        loading={restoring}
      />
    </div>
  )
}
