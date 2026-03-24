'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Plus, Pencil, Trash2, Menu } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Modal'

interface MenuRow {
  id: string
  name: string
  slug: string
  location: string
  updatedAt: string
  _count: { items: number }
}

const LOCATION_META: Record<string, { label: string; desc: string; icon: string }> = {
  header:    { label: 'Header Menüsü',   desc: 'Ana navigasyon',     icon: '📍' },
  'footer-1': { label: 'Footer Menü 1',  desc: 'Kategoriler',        icon: '📋' },
  'footer-2': { label: 'Footer Menü 2',  desc: 'Sayfalar',           icon: '📄' },
  'footer-3': { label: 'Footer Menü 3',  desc: 'Sosyal / Hızlı',    icon: '🔗' },
}

const ALL_LOCATIONS = Object.keys(LOCATION_META)

export default function MenularPage() {
  const toast = useToast()
  const [menus, setMenus] = useState<MenuRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<MenuRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createLocation, setCreateLocation] = useState('header')
  const [creating, setCreating] = useState(false)

  async function fetchMenus() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/menular')
      if (!res.ok) throw new Error()
      setMenus(await res.json())
    } catch {
      toast.error('Menüler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMenus() }, [])

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/superadmin/menular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, location: createLocation }),
      })
      if (!res.ok) throw new Error()
      toast.success('Menü oluşturuldu.')
      setShowCreate(false)
      setCreateName('')
      await fetchMenus()
    } catch {
      toast.error('Oluşturulamadı.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/menular/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Menü silindi.')
      setDeleteTarget(null)
      await fetchMenus()
    } catch {
      toast.error('Silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  // Group menus by location; fill missing locations with null
  const byLocation: Record<string, MenuRow | undefined> = {}
  menus.forEach((m) => { byLocation[m.location] = m })

  return (
    <div className="min-h-screen bg-[#0a0a14] px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">📌 Menü Yönetimi</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-white font-semibold text-sm rounded-lg hover:bg-[#f7931a]/90 transition-colors"
        >
          <Plus size={16} /> Yeni Menü Oluştur
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#606080]">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-sm">Yükleniyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {ALL_LOCATIONS.map((loc) => {
            const meta = LOCATION_META[loc]
            const menu = byLocation[loc]
            return (
              <div
                key={loc}
                className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-white font-semibold text-sm">{meta.label}</span>
                  </div>
                  <p className="text-xs text-[#606080]">{meta.desc}</p>
                </div>

                {menu ? (
                  <>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{menu.name}</p>
                      <p className="text-xs text-[#606080] mt-0.5">{menu._count.items} öğe</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/superadmin/menular/${menu.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1e1e35] text-white text-xs font-medium rounded-lg hover:bg-[#f7931a]/20 hover:text-[#f7931a] transition-colors"
                      >
                        <Pencil size={13} /> Düzenle
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(menu)}
                        className="p-2 rounded-lg text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                    <p className="text-xs text-[#606080] mb-3">Henüz menü yok</p>
                    <button
                      type="button"
                      onClick={() => { setCreateLocation(loc); setShowCreate(true) }}
                      className="text-xs text-[#f7931a] hover:underline"
                    >
                      + Oluştur
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Other menus not in the known locations */}
      {menus.filter((m) => !ALL_LOCATIONS.includes(m.location)).length > 0 && (
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e35]">
            <p className="text-xs font-semibold text-[#606080] uppercase tracking-wider">Diğer Menüler</p>
          </div>
          <table className="w-full">
            <tbody>
              {menus.filter((m) => !ALL_LOCATIONS.includes(m.location)).map((menu) => (
                <tr key={menu.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Menu size={14} className="text-[#606080]" />
                      <span className="text-sm text-white">{menu.name}</span>
                    </div>
                    <p className="text-xs text-[#606080] mt-0.5 ml-5">{menu.location} • {menu._count.items} öğe</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/superadmin/menular/${menu.id}`} className="p-1.5 rounded-lg text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button type="button" onClick={() => setDeleteTarget(menu)} className="p-1.5 rounded-lg text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-semibold text-base mb-5">Yeni Menü Oluştur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">Menü Adı</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Örn: Header Menüsü"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#606080] uppercase tracking-wide mb-1.5">Konum</label>
                <select
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white focus:outline-none focus:border-[#f7931a] text-sm"
                >
                  <option value="header">Header</option>
                  <option value="footer-1">Footer 1 (Kategoriler)</option>
                  <option value="footer-2">Footer 2 (Sayfalar)</option>
                  <option value="footer-3">Footer 3 (Sosyal)</option>
                  <option value="custom">Özel</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateName('') }}
                className="flex-1 py-2.5 bg-[#1e1e35] text-[#606080] hover:text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !createName.trim()}
                className="flex-1 py-2.5 bg-[#f7931a] text-white text-sm font-semibold rounded-lg hover:bg-[#f7931a]/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creating ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Menüyü Sil"
        message={`"${deleteTarget?.name}" menüsünü ve tüm öğelerini kalıcı olarak silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        danger
        loading={deleting}
      />
    </div>
  )
}
