'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Loader2, GripVertical, ChevronDown, ChevronRight, Trash2,
  Plus, Save, ArrowLeft, Pencil, Check, X, Link as LinkIcon,
  FileText, Tag, ExternalLink, IndentDecrease, IndentIncrease,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

// ── Types ──────────────────────────────────────────────────────────
interface FlatItem {
  id: string
  menuId: string
  label: string
  url: string
  type: string
  target: string
  icon: string | null
  order: number
  parentId: string | null
}

interface Category { id: string; name: string; slug: string; icon: string }
interface PageItem  { id: string; title: string; slug: string }
interface PostItem  { id: string; title: string; slug: string; category: { slug: string } }

// ── Sortable Item ──────────────────────────────────────────────────
function SortableMenuItem({
  item, items, onDelete, onUpdate, onIndent, onUnindent,
}: {
  item: FlatItem
  items: FlatItem[]
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<FlatItem>) => void
  onIndent: (id: string) => void
  onUnindent: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(item.label)
  const [editUrl, setEditUrl] = useState(item.url)
  const [editTarget, setEditTarget] = useState(item.target)
  const [editIcon, setEditIcon] = useState(item.icon ?? '')

  const depth = getDepth(items, item.id)
  const canIndent = items.some((i) => i.id !== item.id && i.parentId === item.parentId)
  const hasParent = !!item.parentId

  function saveEdit() {
    onUpdate(item.id, { label: editLabel, url: editUrl, target: editTarget, icon: editIcon || null })
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className={depth > 0 ? 'ml-8' : ''}>
      <div className={`bg-[#0f0f1e] border border-[#1e1e35] rounded-xl mb-2 overflow-hidden ${isDragging ? 'shadow-2xl border-[#f7931a]/40' : ''}`}>
        {/* Item Header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-[#606080] hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          >
            <GripVertical size={16} />
          </button>

          {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{item.label}</p>
            <p className="text-xs text-[#606080] truncate font-mono">{item.url}</p>
          </div>

          {item.target === '_blank' && (
            <ExternalLink size={12} className="text-[#606080] flex-shrink-0" />
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {canIndent && (
              <button
                type="button"
                onClick={() => onIndent(item.id)}
                title="Alt menü yap"
                className="p-1.5 rounded text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
              >
                <IndentIncrease size={13} />
              </button>
            )}
            {hasParent && (
              <button
                type="button"
                onClick={() => onUnindent(item.id)}
                title="Üst seviyeye çıkar"
                className="p-1.5 rounded text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
              >
                <IndentDecrease size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="p-1.5 rounded text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
            >
              {editing ? <ChevronDown size={13} /> : <Pencil size={13} />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="border-t border-[#1e1e35] px-3 py-3 bg-[#0a0a14] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#606080] uppercase mb-1">Etiket</label>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded bg-[#16162a] border border-[#1e1e35] text-white focus:outline-none focus:border-[#f7931a]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#606080] uppercase mb-1">İkon</label>
                <input
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="💻"
                  className="w-full px-2 py-1.5 text-xs rounded bg-[#16162a] border border-[#1e1e35] text-white focus:outline-none focus:border-[#f7931a]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#606080] uppercase mb-1">URL</label>
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-[#16162a] border border-[#1e1e35] text-white font-mono focus:outline-none focus:border-[#f7931a]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[#606080] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editTarget === '_blank'}
                  onChange={(e) => setEditTarget(e.target.checked ? '_blank' : '_self')}
                  className="accent-[#f7931a]"
                />
                Yeni sekmede aç
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#1e1e35] text-[#606080] hover:text-white transition-colors"
                >
                  <X size={11} /> İptal
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#f7931a] text-white transition-colors"
                >
                  <Check size={11} /> Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children */}
      {items.filter((i) => i.parentId === item.id).length > 0 && (
        <div className="ml-8 border-l border-[#1e1e35] pl-3">
          {/* Children are rendered by the parent SortableContext */}
        </div>
      )}
    </div>
  )
}

function getDepth(items: FlatItem[], id: string, depth = 0): number {
  const item = items.find((i) => i.id === id)
  if (!item || !item.parentId) return depth
  return getDepth(items, item.parentId, depth + 1)
}

// ── Left Panel Tab ─────────────────────────────────────────────────
type LeftTab = 'pages' | 'categories' | 'custom' | 'posts'

// ── Main Page ──────────────────────────────────────────────────────
export default function MenuEditorPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const menuId = params.id as string

  const [menuName, setMenuName] = useState('')
  const [menuLocation, setMenuLocation] = useState('')
  const [items, setItems] = useState<FlatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [leftTab, setLeftTab] = useState<LeftTab>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [postSearch, setPostSearch] = useState('')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [customUrl, setCustomUrl] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customBlank, setCustomBlank] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/menular/${menuId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMenuName(data.name)
      setMenuLocation(data.location)
      setItems(data.items)
    } catch {
      toast.error('Menü yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [menuId])

  useEffect(() => {
    fetchMenu()
    // Fetch side data
    fetch('/api/superadmin/kategoriler').then((r) => r.json()).then(setCategories).catch(() => {})
    fetch('/api/superadmin/sayfalar').then((r) => r.json()).then(setPages).catch(() => {})
    fetch('/editor/yazilar?format=json').catch(() => {})
    // Fetch recent posts via a simple approach
    fetch('/api/superadmin/menular/posts-data').catch(() => {})
  }, [fetchMenu])

  // Fetch posts for the Posts tab
  useEffect(() => {
    if (leftTab === 'posts' && posts.length === 0) {
      fetch('/api/superadmin/menular/posts?take=30')
        .then((r) => r.ok ? r.json() : [])
        .then(setPosts)
        .catch(() => {})
    }
  }, [leftTab])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = items.find((i) => i.id === active.id)
    const overItem = items.find((i) => i.id === over.id)
    if (!activeItem || !overItem) return

    // Only reorder within the same parent level
    const sameLevel = items.filter((i) => i.parentId === activeItem.parentId)
    const oldIndex = sameLevel.findIndex((i) => i.id === active.id)
    const newIndex = sameLevel.findIndex((i) => i.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sameLevel, oldIndex, newIndex).map((item, idx) => ({
      ...item, order: idx,
    }))

    setItems((prev) => {
      const otherItems = prev.filter((i) => i.parentId !== activeItem.parentId)
      return [...otherItems, ...reordered].sort((a, b) => {
        if (a.parentId === b.parentId) return a.order - b.order
        return 0
      })
    })
  }

  function handleDelete(id: string) {
    // Also remove children
    setItems((prev) => prev.filter((i) => i.id !== id && i.parentId !== id))
  }

  function handleUpdate(id: string, data: Partial<FlatItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)))
  }

  function handleIndent(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    // Find the previous sibling at the same level to become the parent
    const siblings = items.filter((i) => i.parentId === item.parentId && i.id !== id)
      .sort((a, b) => a.order - b.order)
    const prevSibling = siblings.reverse().find((s) => s.order < item.order) ?? siblings[siblings.length - 1]
    if (!prevSibling) return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, parentId: prevSibling.id, order: 999 } : i)))
  }

  function handleUnindent(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item || !item.parentId) return
    const parent = items.find((i) => i.id === item.parentId)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, parentId: parent?.parentId ?? null, order: 999 } : i)))
  }

  function addItems(newItems: Omit<FlatItem, 'id' | 'menuId' | 'order' | 'parentId'>[]) {
    const maxOrder = items.filter((i) => !i.parentId).length
    const toAdd: FlatItem[] = newItems.map((item, idx) => ({
      id: crypto.randomUUID(),
      menuId,
      order: maxOrder + idx,
      parentId: null,
      ...item,
    }))
    setItems((prev) => [...prev, ...toAdd])
  }

  function addCategories() {
    const toAdd = categories.filter((c) => selectedCats.has(c.id)).map((c) => ({
      label: c.name,
      url: `/${c.slug}`,
      type: 'category',
      target: '_self',
      icon: c.icon,
    }))
    addItems(toAdd)
    setSelectedCats(new Set())
  }

  function addPages() {
    const toAdd = pages.filter((p) => selectedPages.has(p.id)).map((p) => ({
      label: p.title,
      url: `/${p.slug}`,
      type: 'page',
      target: '_self',
      icon: null,
    }))
    addItems(toAdd)
    setSelectedPages(new Set())
  }

  function addPosts() {
    const toAdd = posts.filter((p) => selectedPosts.has(p.id)).map((p) => ({
      label: p.title,
      url: `/${p.category.slug}/${p.slug}`,
      type: 'post',
      target: '_self',
      icon: null,
    }))
    addItems(toAdd)
    setSelectedPosts(new Set())
  }

  function addCustomLink() {
    if (!customUrl.trim() || !customLabel.trim()) return
    addItems([{ label: customLabel, url: customUrl, type: 'custom', target: customBlank ? '_blank' : '_self', icon: null }])
    setCustomUrl('')
    setCustomLabel('')
    setCustomBlank(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Recalculate orders per level
      const flat = reorderFlat(items)
      const [menuRes, itemsRes] = await Promise.all([
        fetch(`/api/superadmin/menular/${menuId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: menuName, location: menuLocation }),
        }),
        fetch(`/api/superadmin/menular/${menuId}/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flat),
        }),
      ])
      if (!menuRes.ok || !itemsRes.ok) throw new Error()
      toast.success('Menü kaydedildi!')
      await fetchMenu()
    } catch {
      toast.error('Kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  function reorderFlat(flat: FlatItem[]): FlatItem[] {
    const result: FlatItem[] = []
    function processLevel(parentId: string | null, order: number) {
      const level = flat.filter((i) => i.parentId === parentId).sort((a, b) => a.order - b.order)
      level.forEach((item, idx) => {
        result.push({ ...item, order: idx })
        processLevel(item.id, 0)
      })
    }
    processLevel(null, 0)
    return result
  }

  const rootItems = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order)
  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm'
  const filteredPosts = posts.filter((p) => p.title.toLowerCase().includes(postSearch.toLowerCase()))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#f7931a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-[#16162a] border-b border-[#1e1e35]">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/menular" className="text-[#606080] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-white font-semibold text-sm">{menuName}</h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-white font-semibold text-sm rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Kaydediliyor...' : 'Menüyü Kaydet'}
        </button>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* LEFT PANEL */}
        <div className="w-72 shrink-0 border-r border-[#1e1e35] bg-[#16162a] flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#1e1e35]">
            {([
              { id: 'categories', label: 'Kategoriler', icon: <Tag size={13} /> },
              { id: 'pages',      label: 'Sayfalar',    icon: <FileText size={13} /> },
              { id: 'custom',     label: 'Özel',        icon: <LinkIcon size={13} /> },
              { id: 'posts',      label: 'Yazılar',     icon: <FileText size={13} /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeftTab(tab.id)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  leftTab === tab.id
                    ? 'text-[#f7931a] border-b-2 border-[#f7931a] -mb-px'
                    : 'text-[#606080] hover:text-white'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {/* CATEGORIES TAB */}
            {leftTab === 'categories' && (
              <>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#1e1e35]/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCats.has(cat.id)}
                      onChange={(e) => {
                        const s = new Set(selectedCats)
                        e.target.checked ? s.add(cat.id) : s.delete(cat.id)
                        setSelectedCats(s)
                      }}
                      className="accent-[#f7931a]"
                    />
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm text-[#606080]">{cat.name}</span>
                  </label>
                ))}
                {categories.length === 0 && <p className="text-xs text-[#606080] text-center py-4">Kategori yok</p>}
              </>
            )}

            {/* PAGES TAB */}
            {leftTab === 'pages' && (
              <>
                {(Array.isArray(pages) ? pages : []).map((page) => (
                  <label key={page.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#1e1e35]/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.id)}
                      onChange={(e) => {
                        const s = new Set(selectedPages)
                        e.target.checked ? s.add(page.id) : s.delete(page.id)
                        setSelectedPages(s)
                      }}
                      className="accent-[#f7931a]"
                    />
                    <FileText size={14} className="text-[#606080] flex-shrink-0" />
                    <span className="text-sm text-[#606080] truncate">{page.title}</span>
                  </label>
                ))}
                {pages.length === 0 && <p className="text-xs text-[#606080] text-center py-4">Sayfa yok</p>}
              </>
            )}

            {/* CUSTOM TAB */}
            {leftTab === 'custom' && (
              <div className="space-y-3 p-1">
                <div>
                  <label className="block text-[10px] text-[#606080] uppercase mb-1.5">Etiket</label>
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Örn: Ana Sayfa"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#606080] uppercase mb-1.5">URL</label>
                  <input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https:// veya /"
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-[#606080] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customBlank}
                    onChange={(e) => setCustomBlank(e.target.checked)}
                    className="accent-[#f7931a]"
                  />
                  Yeni sekmede aç
                </label>
              </div>
            )}

            {/* POSTS TAB */}
            {leftTab === 'posts' && (
              <>
                <input
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Yazı ara..."
                  className={`${inputClass} mb-2`}
                />
                {filteredPosts.map((post) => (
                  <label key={post.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#1e1e35]/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={(e) => {
                        const s = new Set(selectedPosts)
                        e.target.checked ? s.add(post.id) : s.delete(post.id)
                        setSelectedPosts(s)
                      }}
                      className="accent-[#f7931a]"
                    />
                    <span className="text-sm text-[#606080] truncate">{post.title}</span>
                  </label>
                ))}
                {filteredPosts.length === 0 && <p className="text-xs text-[#606080] text-center py-4">Yazı yok</p>}
              </>
            )}
          </div>

          {/* Add Button */}
          <div className="p-3 border-t border-[#1e1e35]">
            {leftTab === 'categories' && (
              <button
                type="button"
                onClick={addCategories}
                disabled={selectedCats.size === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f7931a] text-white text-sm font-semibold rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Menüye Ekle ({selectedCats.size})
              </button>
            )}
            {leftTab === 'pages' && (
              <button
                type="button"
                onClick={addPages}
                disabled={selectedPages.size === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f7931a] text-white text-sm font-semibold rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Menüye Ekle ({selectedPages.size})
              </button>
            )}
            {leftTab === 'custom' && (
              <button
                type="button"
                onClick={addCustomLink}
                disabled={!customUrl.trim() || !customLabel.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f7931a] text-white text-sm font-semibold rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Ekle
              </button>
            )}
            {leftTab === 'posts' && (
              <button
                type="button"
                onClick={addPosts}
                disabled={selectedPosts.size === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#f7931a] text-white text-sm font-semibold rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Menüye Ekle ({selectedPosts.size})
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Menu settings */}
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4 mb-6 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">Menü Adı</label>
              <input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">Konum</label>
              <select
                value={menuLocation}
                onChange={(e) => setMenuLocation(e.target.value)}
                className={inputClass}
              >
                <option value="header">Header</option>
                <option value="footer-1">Footer 1</option>
                <option value="footer-2">Footer 2</option>
                <option value="footer-3">Footer 3</option>
                <option value="custom">Özel</option>
              </select>
            </div>
          </div>

          {/* Menu items */}
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4 min-h-48">
            <p className="text-xs font-semibold text-[#606080] uppercase tracking-wider mb-4">
              Menü Yapısı
              <span className="ml-2 text-[#f7931a] normal-case font-normal">
                — Sürükle bırak ile sırala, ↔ ile iç içe yap
              </span>
            </p>

            {items.length === 0 ? (
              <div className="text-center py-12 text-[#606080]">
                <p className="text-sm">Henüz öğe yok.</p>
                <p className="text-xs mt-1">Sol panelden öğe ekleyin.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {/* Root items */}
                <SortableContext items={rootItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {rootItems.map((item) => (
                    <div key={item.id}>
                      <SortableMenuItem
                        item={item}
                        items={items}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onIndent={handleIndent}
                        onUnindent={handleUnindent}
                      />
                      {/* Children of this root item */}
                      {items.filter((i) => i.parentId === item.id).length > 0 && (
                        <div className="ml-6 pl-3 border-l border-[#1e1e35]">
                          <SortableContext
                            items={items.filter((i) => i.parentId === item.id).sort((a, b) => a.order - b.order).map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {items
                              .filter((i) => i.parentId === item.id)
                              .sort((a, b) => a.order - b.order)
                              .map((child) => (
                                <SortableMenuItem
                                  key={child.id}
                                  item={child}
                                  items={items}
                                  onDelete={handleDelete}
                                  onUpdate={handleUpdate}
                                  onIndent={handleIndent}
                                  onUnindent={handleUnindent}
                                />
                              ))}
                          </SortableContext>
                        </div>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Save button bottom */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#f7931a] text-white font-semibold text-sm rounded-xl hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Kaydediliyor...' : 'Menüyü Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
