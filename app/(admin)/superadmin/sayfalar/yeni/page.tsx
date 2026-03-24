'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { useToast } from '@/components/ui/Toast'

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

export default function YeniSayfaPage() {
  const router = useRouter()
  const toast = useToast()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [slugEditing, setSlugEditing] = useState(false)
  const [content, setContent] = useState('')
  const [template, setTemplate] = useState('default')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [showInMenu, setShowInMenu] = useState(false)
  const [menuOrder, setMenuOrder] = useState(0)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const slugInputRef = useRef<HTMLInputElement>(null)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) {
      setSlug(slugify(val))
    }
  }

  function enableSlugEdit() {
    setSlugEditing(true)
    setSlugManual(true)
    setTimeout(() => slugInputRef.current?.focus(), 50)
  }

  async function handleSave(publishStatus: 'DRAFT' | 'PUBLISHED') {
    if (!title.trim()) {
      toast.error('Başlık zorunludur.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/sayfalar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          slug: slug || slugify(title),
          template,
          status: publishStatus,
          showInMenu,
          menuOrder,
          seoTitle: seoTitle || undefined,
          seoDesc: seoDesc || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string; message?: string }).error ?? (err as { message?: string }).message ?? `HTTP ${res.status}`)
      }

      const page = await res.json()
      toast.success('Sayfa oluşturuldu!')
      router.push(`/superadmin/sayfalar/${page.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const displaySlug = slug || slugify(title) || 'sayfa-slug'

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-[#16162a] border-b border-[#1e1e35]">
        <h1 className="text-white font-semibold text-sm">Yeni Sayfa</h1>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-[#606080]">
              <Loader2 size={14} className="animate-spin" />
              Kaydediliyor...
            </span>
          )}
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
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Sayfa başlığını girin"
            className="w-full bg-transparent border-none outline-none text-white text-3xl font-bold placeholder-[#1e1e35] mb-4 leading-tight"
          />

          {/* Slug display */}
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
                <span className="text-[#606080] font-mono">/{displaySlug}</span>
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
            onChange={setContent}
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
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Kaydediliyor...
                  </span>
                ) : (
                  'Taslak Kaydet'
                )}
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
            </div>
          </div>

          {/* Card 2 — Sayfa Ayarları */}
          <div className={cardClass}>
            <p className={labelClass}>Sayfa Ayarları</p>
            <div className="space-y-3">
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
        </aside>
      </div>
    </div>
  )
}
