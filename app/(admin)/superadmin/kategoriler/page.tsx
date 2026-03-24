'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  description?: string
  type: string
  menuOrder: number
  showInMenu: boolean
  showInHome: boolean
  parentId?: string | null
  children: Category[]
  _count: { posts: number }
}

const COLOR_OPTIONS = [
  { label: 'Finans (Turuncu)',      value: 'cat-finans',       hex: '#f7931a' },
  { label: 'Ekonomi (Mavi)',        value: 'cat-ekonomi',      hex: '#3b82f6' },
  { label: 'Gayrimenkul (Yeşil)',   value: 'cat-gayrimenkul',  hex: '#10b981' },
  { label: 'Oyun (Mor)',            value: 'cat-oyun',         hex: '#a855f7' },
  { label: 'Teknoloji (Turkuaz)',   value: 'cat-teknoloji',    hex: '#00c896' },
  { label: 'Rehber (Amber)',        value: 'cat-rehber',       hex: '#f59e0b' },
  { label: 'Son Dakika (Kırmızı)', value: 'cat-son-dakika',   hex: '#ef4444' },
  { label: 'Trend (Pembe)',         value: 'cat-trend',        hex: '#ec4899' },
]

const colorHex: Record<string, string> = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.value, c.hex]))

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function KategorilerPage() {
  const { success, error: toastError } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', slug: '', icon: '📰', color: 'cat-finans',
    description: '', type: 'news', parentId: '',
    showInMenu: true, showInHome: true, menuOrder: 0,
  })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/kategoriler')
    if (res.ok) {
      const data = await res.json()
      const cats: Category[] = data.categories ?? data
      // Hiyerarşi: sadece ana kategorileri göster, children içinde alt kategoriler
      const roots = cats.filter((c) => !c.parentId)
      setCategories(roots)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd(parentId?: string) {
    setEditingCat(null)
    setForm({ name: '', slug: '', icon: '📰', color: 'cat-finans', description: '', type: 'news', parentId: parentId ?? '', showInMenu: true, showInHome: !parentId, menuOrder: 0 })
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditingCat(cat)
    setForm({
      name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color,
      description: cat.description ?? '', type: cat.type,
      parentId: cat.parentId ?? '', showInMenu: cat.showInMenu, showInHome: cat.showInHome, menuOrder: cat.menuOrder,
    })
    setShowModal(true)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editingCat ? `/api/kategoriler/${editingCat.id}` : '/api/kategoriler'
      const method = editingCat ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      })
      if (!res.ok) throw new Error()
      success(editingCat ? 'Kategori güncellendi' : 'Kategori oluşturuldu')
      setShowModal(false)
      load()
    } catch {
      toastError('İşlem başarısız')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingCat) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/kategoriler/${deletingCat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      success('Kategori silindi')
      setDeletingCat(null)
      load()
    } catch {
      toastError('Silinemedi')
    } finally {
      setDeleting(false)
    }
  }

  const topParents = categories.filter((c) => !c.parentId)
  const totalCats = categories.reduce((sum, c) => sum + 1 + c.children.length, 0)
  const totalPosts = categories.reduce((sum, c) => sum + c._count.posts + c.children.reduce((s, ch) => s + ch._count.posts, 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Kategoriler</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{totalCats} kategori • {totalPosts} yazı</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2 bg-accent-tech text-dark-bg rounded-lg text-sm font-semibold hover:bg-accent-tech/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Ana Kategori
        </button>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const hex = colorHex[cat.color] ?? '#00c896'
            const isExpanded = expanded[cat.id] !== false // default expanded
            return (
              <div key={cat.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                {/* Ana Kategori Row */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ borderLeft: `4px solid ${hex}` }}>
                  <button onClick={() => toggleExpand(cat.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    {cat.children.length > 0 ? (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{cat.name}</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">/{cat.slug}</span>
                      {cat.type === 'guide' && <span className="px-1.5 py-0.5 text-xs rounded bg-[#f59e0b]/20 text-[#f59e0b] font-mono">rehber</span>}
                      {!cat.showInMenu && <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-muted)] font-mono">gizli</span>}
                    </div>
                    {cat.description && <p className="text-xs text-[var(--text-muted)] truncate">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="font-mono">{cat._count.posts} yazı</span>
                    <span>{cat.children.length} alt</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAdd(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-accent-tech transition-colors"
                      title="Alt kategori ekle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCat(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alt Kategoriler */}
                {isExpanded && cat.children.length > 0 && (
                  <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]/50">
                    {cat.children.map((child) => {
                      const childHex = colorHex[child.color] ?? hex
                      return (
                        <div key={child.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 bg-[var(--bg-primary)]/50">
                          <span className="text-base">{child.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--text-primary)]">{child.name}</span>
                              <span className="text-xs text-[var(--text-muted)] font-mono">/{child.slug}</span>
                              {child.type === 'guide' && <span className="px-1 py-0.5 text-xs rounded bg-[#f59e0b]/20 text-[#f59e0b] font-mono">rehber</span>}
                            </div>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">{child._count.posts} yazı</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(child)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeletingCat(child)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingCat ? `Düzenle: ${editingCat.name}` : (form.parentId ? 'Alt Kategori Ekle' : 'Ana Kategori Ekle')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Ad *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent-tech"
                placeholder="Kategori adı"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-accent-tech"
                placeholder="url-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">İkon (emoji)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-center text-2xl focus:outline-none focus:border-accent-tech"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Tür</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none"
              >
                <option value="news">📰 Haber</option>
                <option value="guide">📚 Rehber</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Renk</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all"
                  style={form.color === c.value
                    ? { borderColor: c.hex, background: `${c.hex}20`, color: c.hex }
                    : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.hex }} />
                  <span className="truncate">{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Açıklama</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent-tech"
              placeholder="Kategori açıklaması"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
              <input type="checkbox" checked={form.showInMenu} onChange={(e) => setForm((f) => ({ ...f, showInMenu: e.target.checked }))} className="rounded" />
              Menüde göster
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
              <input type="checkbox" checked={form.showInHome} onChange={(e) => setForm((f) => ({ ...f, showInHome: e.target.checked }))} className="rounded" />
              Ana sayfada göster
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-accent-tech text-dark-bg text-sm font-semibold hover:bg-accent-tech/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCat ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={handleDelete}
        title="Kategoriyi Sil"
        message={`"${deletingCat?.name}" kategorisini silmek istediğinize emin misiniz? ${deletingCat?.children?.length ? `${deletingCat.children.length} alt kategori de silinecek.` : ''}`}
        confirmLabel="Sil"
        loading={deleting}
        danger
      />
    </div>
  )
}
