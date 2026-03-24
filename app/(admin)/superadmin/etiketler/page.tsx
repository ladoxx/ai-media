'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag, Plus, Search, RefreshCw, Pencil, Eye, Trash2,
  ArrowUp, ArrowDown, Loader2, Check, X, Merge,
} from 'lucide-react'
import Link from 'next/link'

interface TagItem {
  id: string
  name: string
  slug: string
  description?: string
  seoTitle?: string
  seoDesc?: string
  postCount: number
  createdAt: string
}

interface TagData {
  tags: TagItem[]
  total: number
  pages: number
  addedThisMonth: number
  topTag?: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-çğışöü]/g, '').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ü/g,'u')
}

type SortKey = 'name' | 'postCount' | 'createdAt'

export default function EtiketlerPage() {
  const [data, setData]       = useState<TagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<SortKey>('postCount')
  const [order, setOrder]     = useState<'asc' | 'desc'>('desc')
  const [page, setPage]       = useState(1)

  // Form state
  const [form, setForm]       = useState<Partial<TagItem> | null>(null)
  const [saving, setSaving]   = useState(false)
  const [slugManual, setSlugManual] = useState(false)

  // Merge modal
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [merging, setMerging] = useState(false)

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), sort, order })
    if (search) params.set('q', search)
    const res = await fetch(`/api/superadmin/etiketler?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [page, sort, order, search])

  useEffect(() => { load() }, [load])

  const toggleSort = (key: SortKey) => {
    if (sort === key) setOrder((o) => o === 'asc' ? 'desc' : 'asc')
    else { setSort(key); setOrder('desc') }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 text-xs font-medium transition-colors ${sort === k ? 'text-[#00c896]' : 'text-[#606080] hover:text-white'}`}>
      {label}
      {sort === k ? (order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUp className="w-3 h-3 opacity-30" />}
    </button>
  )

  const openCreate = () => setForm({ name: '', slug: '', description: '', seoTitle: '', seoDesc: '' })
  const openEdit   = (tag: TagItem) => { setForm({ ...tag }); setSlugManual(true) }

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugManual ? f?.slug ?? '' : slugify(name) }))
  }

  const save = async () => {
    if (!form?.name?.trim()) return
    setSaving(true)
    const isEdit = Boolean(form.id)
    const url = isEdit ? `/api/superadmin/etiketler/${form.id}` : '/api/superadmin/etiketler'
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setForm(null)
    setSlugManual(false)
    load()
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`"${name}" etiketini silmek istediğinizden emin misiniz? Yazılardan kaldırılacak.`)) return
    setDeleting(id)
    await fetch(`/api/superadmin/etiketler/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const doMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return
    setMerging(true)
    await fetch('/api/superadmin/etiketler/birlestir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: mergeSource, targetId: mergeTarget }),
    })
    setMerging(false)
    setMergeMode(false)
    setMergeSource(''); setMergeTarget('')
    load()
  }

  const tags = data?.tags ?? []

  // Tag cloud preview
  const cloudTags = [...tags].sort((a, b) => b.postCount - a.postCount).slice(0, 30)
  const maxCount = Math.max(...cloudTags.map((t) => t.postCount), 1)

  function cloudSize(count: number) {
    const ratio = count / maxCount
    if (ratio > 0.7) return 'text-xl font-bold'
    if (ratio > 0.4) return 'text-lg font-semibold'
    if (ratio > 0.2) return 'text-base'
    return 'text-sm'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-[#00c896]" />Etiket Yönetimi</h1>
          <p className="text-sm text-[#606080] mt-0.5">{data?.total ?? 0} etiket</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMergeMode(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e35] text-[#a0a0c0] hover:text-white text-sm transition-colors">
            <Merge className="w-4 h-4" />Birleştir
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00c896] text-[#0d0d14] font-semibold text-sm hover:bg-[#00c896]/90 transition-colors">
            <Plus className="w-4 h-4" />Yeni Etiket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-4">
          <p className="text-xs text-[#606080]">Toplam Etiket</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.total ?? 0}</p>
        </div>
        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-4">
          <p className="text-xs text-[#606080]">Bu Ay Eklenen</p>
          <p className="text-2xl font-bold text-[#00c896] mt-1">{data?.addedThisMonth ?? 0}</p>
        </div>
        <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-4">
          <p className="text-xs text-[#606080]">En Çok Kullanılan</p>
          <p className="text-base font-bold text-[#f7931a] mt-1 truncate">#{data?.topTag ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: List */}
        <div>
          {/* Search + Sort */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606080]" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Etiket ara..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]" />
            </div>
            <button onClick={load} className="p-2 rounded-lg bg-[#1e1e35] text-[#606080] hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#1e1e35] text-xs text-[#606080]">
              <span>#</span>
              <SortBtn k="name" label="Etiket" />
              <SortBtn k="postCount" label="Yazı Sayısı" />
              <SortBtn k="createdAt" label="Tarih" />
              <span>İşlemler</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-[#00c896]" /></div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12 text-[#606080]"><Tag className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Etiket bulunamadı</p></div>
            ) : (
              tags.map((tag, i) => (
                <div key={tag.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 border-b border-[#0f0f1a] hover:bg-[#0f0f1a] transition-colors last:border-0">
                  <span className="text-xs text-[#606080]">{(page - 1) * 50 + i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#00c896] flex-shrink-0" />
                      <span className="text-sm font-medium text-white truncate">{tag.name}</span>
                    </div>
                    <span className="text-xs text-[#606080] ml-5">/{tag.slug}</span>
                  </div>
                  <span className="text-sm text-[#a0a0c0] text-center">{tag.postCount}</span>
                  <span className="text-xs text-[#606080] whitespace-nowrap">{new Date(tag.createdAt).toLocaleDateString('tr-TR')}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(tag)} className="p-1.5 rounded-lg text-[#606080] hover:text-[#00c896] hover:bg-[#00c896]/10 transition-colors" title="Düzenle">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <Link href={`/etiket/${tag.slug}`} target="_blank" className="p-1.5 rounded-lg text-[#606080] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors" title="Görüntüle">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => del(tag.id, tag.name)} disabled={deleting === tag.id} className="p-1.5 rounded-lg text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Sil">
                      {deleting === tag.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex gap-2 justify-center mt-4">
              {Array.from({ length: data.pages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === i + 1 ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#606080] hover:text-white'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Form + Cloud */}
        <div className="space-y-4">
          {/* Form */}
          {form !== null && (
            <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{form.id ? 'Etiketi Düzenle' : 'Yeni Etiket Ekle'}</h3>
                <button onClick={() => { setForm(null); setSlugManual(false) }} className="text-[#606080] hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#606080] mb-1 block">Etiket Adı *</label>
                  <input value={form.name ?? ''} onChange={(e) => handleNameChange(e.target.value)} placeholder="bitcoin"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]" />
                </div>
                <div>
                  <label className="text-xs text-[#606080] mb-1 block">Slug</label>
                  <input value={form.slug ?? ''} onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })) }} placeholder="bitcoin"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-[#a0a0c0] placeholder-[#606080] focus:outline-none focus:border-[#00c896] font-mono" />
                </div>
                <div>
                  <label className="text-xs text-[#606080] mb-1 block">Açıklama</label>
                  <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Opsiyonel"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[#606080] mb-1 block">SEO Başlığı</label>
                  <input value={form.seoTitle ?? ''} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} placeholder="Bitcoin Haberleri - Cyba"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]" />
                </div>
                <div>
                  <label className="text-xs text-[#606080] mb-1 block">Meta Description</label>
                  <textarea value={form.seoDesc ?? ''} onChange={(e) => setForm((f) => ({ ...f, seoDesc: e.target.value }))} rows={2} placeholder="Bitcoin ile ilgili son haberler..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] resize-none" />
                </div>
                <button onClick={save} disabled={saving || !form.name?.trim()}
                  className="w-full py-2.5 rounded-lg bg-[#00c896] text-[#0d0d14] font-semibold text-sm hover:bg-[#00c896]/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {form.id ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </div>
          )}

          {/* Tag Cloud Preview */}
          <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold text-[#606080] uppercase tracking-widest mb-3">Etiket Bulutu Önizleme</h3>
            {cloudTags.length === 0 ? (
              <p className="text-xs text-[#606080]">Henüz etiket yok</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cloudTags.map((tag) => (
                  <Link key={tag.id} href={`/etiket/${tag.slug}`} target="_blank"
                    className={`${cloudSize(tag.postCount)} text-[#a0a0c0] hover:text-[#00c896] transition-colors`}>
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Merge Modal */}
      {mergeMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setMergeMode(false)}>
          <div className="bg-[#12121f] border border-[#1e1e35] rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2"><Merge className="w-4 h-4 text-[#00c896]" />Etiketleri Birleştir</h2>
              <button onClick={() => setMergeMode(false)} className="text-[#606080] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-[#606080] mb-4">Kaynak etiket, hedef etiketle birleştirilir ve silinir.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#606080] mb-1 block">Kaynak Etiket (silinecek)</label>
                <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]">
                  <option value="">Seçin...</option>
                  {tags.filter((t) => t.id !== mergeTarget).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.postCount})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#606080] mb-1 block">Hedef Etiket (korunacak)</label>
                <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]">
                  <option value="">Seçin...</option>
                  {tags.filter((t) => t.id !== mergeSource).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.postCount})</option>
                  ))}
                </select>
              </div>
              <button onClick={doMerge} disabled={!mergeSource || !mergeTarget || merging}
                className="w-full py-2.5 rounded-lg bg-[#f7931a] text-[#0d0d14] font-semibold text-sm hover:bg-[#f7931a]/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                Birleştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
