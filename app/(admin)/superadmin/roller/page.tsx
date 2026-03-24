'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, ShieldCheck, Check, Copy } from 'lucide-react'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Permission { id: string; module: string; action: string; label: string }
interface RoleRow {
  id: string
  name: string
  slug: string
  description: string | null
  permissions: { permission: Permission }[]
  _count: { users: number }
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#a78bfa] text-sm'

const MODULE_LABELS: Record<string, string> = {
  content: '📝 İçerik', media: '🖼️ Medya', category: '🏷️ Kategori',
  menu: '📋 Menü', page: '📄 Sayfa', tag: '🔖 Etiket',
  automation: '🤖 Otomasyon', revenue: '💰 Gelir', ads: '📣 Reklam',
  affiliate: '🔗 Affiliate', user: '👥 Kullanıcı', theme: '🎨 Tema',
  plugin: '🔌 Plugin', widget: '🧩 Widget', newsletter: '📧 Newsletter',
  settings: '⚙️ Ayarlar', backup: '💾 Yedek', logs: '📋 Loglar',
  cloudflare: '☁️ Cloudflare',
}

export default function RollerPage() {
  const { success, error } = useToast()
  const [roles,    setRoles]    = useState<RoleRow[]>([])
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [loading,  setLoading]  = useState(true)

  const [showAddModal,  setShowAddModal]  = useState(false)
  const [editingRole,   setEditingRole]   = useState<RoleRow | null>(null)
  const [deleteRole,    setDeleteRole]    = useState<RoleRow | null>(null)
  const [deleting,      setDeleting]      = useState(false)

  const [formName,      setFormName]      = useState('')
  const [formDesc,      setFormDesc]      = useState('')
  const [formPerms,     setFormPerms]     = useState<string[]>([]) // permissionIds
  const [saving,        setSaving]        = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/roller')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRoles(data.roles ?? [])
      setAllPerms((data.allPermissions ?? []).filter((p: Permission) => p.module !== 'apikey'))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // Modüle göre grupla
  const groupedPerms = allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  function openAdd() {
    setFormName(''); setFormDesc(''); setFormPerms([])
    setEditingRole(null)
    setShowAddModal(true)
  }

  function openEdit(r: RoleRow) {
    setFormName(r.name)
    setFormDesc(r.description ?? '')
    setFormPerms(r.permissions.map(rp => rp.permission.id))
    setEditingRole(r)
    setShowAddModal(true)
  }

  function openCopy(r: RoleRow) {
    setFormName(`${r.name} (Kopya)`)
    setFormDesc(r.description ?? '')
    setFormPerms(r.permissions.map(rp => rp.permission.id))
    setEditingRole(null)
    setShowAddModal(true)
  }

  function togglePerm(id: string) {
    setFormPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function toggleModule(module: string) {
    const moduleIds = (groupedPerms[module] ?? []).map(p => p.id)
    const allSelected = moduleIds.every(id => formPerms.includes(id))
    if (allSelected) {
      setFormPerms(prev => prev.filter(id => !moduleIds.includes(id)))
    } else {
      setFormPerms(prev => [...new Set([...prev, ...moduleIds])])
    }
  }

  async function handleSave() {
    if (!formName.trim()) { error('Rol adı zorunludur'); return }
    setSaving(true)
    try {
      const url = editingRole ? `/api/superadmin/roller/${editingRole.id}` : '/api/superadmin/roller'
      const method = editingRole ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDesc, permissionIds: formPerms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      success(editingRole ? 'Rol güncellendi' : 'Rol oluşturuldu')
      setShowAddModal(false)
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteRole) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/roller/${deleteRole.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      success('Rol silindi')
      setDeleteRole(null)
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#a78bfa]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rol Şablonları</h1>
            <p className="text-xs text-[#606080]">Yetki gruplarını yönet</p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20">
            {roles.length}
          </span>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Yeni Rol
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#606080]">
          <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Yükleniyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => {
            const permKeys = role.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`)
            const modules = [...new Set(role.permissions.map(rp => rp.permission.module))]

            return (
              <div key={role.id} className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1e1e35]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{role.name}</h3>
                      {role.description && <p className="text-xs text-[#606080] mt-0.5">{role.description}</p>}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 whitespace-nowrap">
                      {role._count.users} kullanıcı
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {modules.map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e35] text-[#a0a0c0]">
                        {MODULE_LABELS[m] ?? m}
                      </span>
                    ))}
                    {permKeys.length === 0 && <span className="text-xs text-[#404060]">Yetki atanmamış</span>}
                  </div>
                  <p className="text-[10px] text-[#404060]">{permKeys.length} yetki</p>
                </div>

                <div className="px-5 py-3 bg-[#0a0a14]/50 flex items-center gap-2 border-t border-[#1e1e35]">
                  <button onClick={() => openEdit(role)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#1e1e35] rounded-lg text-[#606080] hover:text-white hover:border-[#606080] transition-colors">
                    <Pencil size={12} /> Düzenle
                  </button>
                  <button onClick={() => openCopy(role)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#1e1e35] rounded-lg text-[#606080] hover:text-white hover:border-[#606080] transition-colors">
                    <Copy size={12} /> Kopyala
                  </button>
                  <button onClick={() => setDeleteRole(role)} disabled={role._count.users > 0}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-transparent rounded-lg text-[#606080] hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto">
                    <Trash2 size={12} /> Sil
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}
        title={editingRole ? `Rolü Düzenle: ${editingRole.name}` : 'Yeni Rol Oluştur'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Rol Adı</label>
            <input className={INPUT} placeholder="İçerik Editörü" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Açıklama</label>
            <input className={INPUT} placeholder="Kısa açıklama..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#606080]">Yetkiler</label>
              <span className="text-[10px] text-[#a78bfa]">{formPerms.length} seçili</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {Object.entries(groupedPerms).map(([module, perms]) => {
                const moduleIds = perms.map(p => p.id)
                const allSelected = moduleIds.every(id => formPerms.includes(id))
                const someSelected = moduleIds.some(id => formPerms.includes(id))

                return (
                  <div key={module} className="bg-[#0a0a14] border border-[#1e1e35] rounded-lg p-3">
                    <button type="button" onClick={() => toggleModule(module)}
                      className={`flex items-center gap-2 w-full text-xs font-medium mb-2 ${allSelected ? 'text-[#a78bfa]' : someSelected ? 'text-[#a0a0c0]' : 'text-[#606080]'}`}>
                      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${allSelected ? 'bg-[#a78bfa] border-[#a78bfa]' : someSelected ? 'border-[#a78bfa]/50 bg-[#a78bfa]/10' : 'border-[#1e1e35]'}`}>
                        {allSelected && <Check size={8} />}
                      </span>
                      {MODULE_LABELS[module] ?? module}
                    </button>
                    <div className="grid grid-cols-2 gap-1">
                      {perms.map(p => (
                        <button key={p.id} type="button" onClick={() => togglePerm(p.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                            formPerms.includes(p.id)
                              ? 'bg-[#a78bfa]/10 text-[#a78bfa]'
                              : 'text-[#606080] hover:text-[#a0a0c0]'
                          }`}>
                          <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${formPerms.includes(p.id) ? 'bg-[#a78bfa] border-[#a78bfa]' : 'border-[#1e1e35]'}`}>
                            {formPerms.includes(p.id) && <Check size={7} />}
                          </span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f7931a]/5 border border-[#f7931a]/20">
            <span className="text-xs text-[#f7931a]">🔒 API Key yetkisi hiçbir role eklenemez</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors">İptal</button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : editingRole ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteRole} onClose={() => setDeleteRole(null)} onConfirm={handleDelete}
        title="Rolü Sil"
        message={`"${deleteRole?.name}" rolünü silmek istediğinizden emin misiniz?`}
        confirmLabel="Evet, Sil" danger loading={deleting} />
    </div>
  )
}
