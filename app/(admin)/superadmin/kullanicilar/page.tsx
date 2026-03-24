'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Pencil, Trash2, Plus, RefreshCw, User, Check, X, ShieldCheck, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useSession } from 'next-auth/react'

interface Permission { id: string; module: string; action: string; label: string }
interface RoleRow    { id: string; name: string; slug: string; permissions: { permission: Permission }[] }

interface UserRow {
  id: string
  name: string
  email: string
  systemRole: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'
  active: boolean
  roleId: string | null
  roleTemplate: { id: string; name: string } | null
  createdAt: string
  _count: { posts: number }
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm'

function generatePassword(length = 12) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-[#f7931a]/10 text-[#f7931a] border-[#f7931a]/20',
  ADMIN:      'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20',
  EDITOR:     'bg-[#00c896]/10 text-[#00c896] border-[#00c896]/20',
}
const ROLE_LABELS: Record<string, string> = { SUPERADMIN: 'SuperAdmin', ADMIN: 'Admin', EDITOR: 'Editör' }

// Modül Türkçe etiketleri
const MODULE_LABELS: Record<string, string> = {
  content: '📝 İçerik', media: '🖼️ Medya', category: '🏷️ Kategori',
  menu: '📋 Menü', page: '📄 Sayfa', tag: '🔖 Etiket',
  automation: '🤖 Otomasyon', revenue: '💰 Gelir', ads: '📣 Reklam',
  affiliate: '🔗 Affiliate', user: '👥 Kullanıcı', theme: '🎨 Tema',
  plugin: '🔌 Plugin', widget: '🧩 Widget', newsletter: '📧 Newsletter',
  settings: '⚙️ Ayarlar', backup: '💾 Yedek', logs: '📋 Loglar',
  cloudflare: '☁️ Cloudflare',
}

export default function KullanicilarPage() {
  const { data: session } = useSession()
  const { success, error } = useToast()
  const currentUserId = (session?.user as any)?.id

  const [users,   setUsers]   = useState<UserRow[]>([])
  const [roles,   setRoles]   = useState<RoleRow[]>([])
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [editingUser,     setEditingUser]     = useState<UserRow | null>(null)
  const [deleteUser,      setDeleteUser]      = useState<UserRow | null>(null)
  const [permUser,        setPermUser]        = useState<UserRow | null>(null)
  const [deleting,        setDeleting]        = useState(false)

  // Add form
  const [addForm,    setAddForm]   = useState({ name: '', email: '', password: '', systemRole: 'EDITOR' })
  const [showAddPw,  setShowAddPw] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  // Edit form
  const [editForm,         setEditForm]         = useState({ name: '', email: '', systemRole: 'EDITOR', newPassword: '' })
  const [showEditPw,       setShowEditPw]       = useState(false)
  const [showNewPwField,   setShowNewPwField]   = useState(false)
  const [editLoading,      setEditLoading]      = useState(false)

  // Yetki modal state
  const [permData,         setPermData]         = useState<{ roleId: string | null; rolePerms: string[]; addedPerms: string[]; removedPerms: string[] } | null>(null)
  const [permLoading,      setPermLoading]      = useState(false)
  const [permSaving,       setPermSaving]       = useState(false)

  async function fetchAll() {
    setLoading(true)
    try {
      const [uRes, rRes] = await Promise.all([
        fetch('/api/superadmin/kullanicilar'),
        fetch('/api/superadmin/roller'),
      ])
      if (uRes.ok) {
        const data = await uRes.json()
        if (Array.isArray(data)) setUsers(data)
      }
      if (rRes.ok) {
        const data = await rRes.json()
        setRoles(data.roles ?? [])
        setAllPerms((data.allPermissions ?? []).filter((p: Permission) => p.module !== 'apikey'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Onay bekleyenler
  const pending = users.filter(u => !u.active && u.systemRole !== 'SUPERADMIN')

  async function handleApprove(userId: string) {
    try {
      const res = await fetch('/api/superadmin/kullanicilar/onayla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      success('Kullanıcı onaylandı')
      fetchAll()
    } catch (err: any) { error(err.message) }
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    try {
      const res = await fetch('/api/superadmin/kullanicilar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      success('Kullanıcı oluşturuldu')
      setShowAddModal(false)
      setAddForm({ name: '', email: '', password: '', systemRole: 'EDITOR' })
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setAddLoading(false) }
  }

  function openEdit(u: UserRow) {
    setEditingUser(u)
    setEditForm({ name: u.name, email: u.email, systemRole: u.systemRole, newPassword: '' })
    setShowNewPwField(false)
    setShowEditPw(false)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setEditLoading(true)
    try {
      const body: any = { id: editingUser.id, ...editForm }
      if (!showNewPwField || !editForm.newPassword) delete body.newPassword
      const res = await fetch('/api/superadmin/kullanicilar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, role: editForm.systemRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      success('Kullanıcı güncellendi')
      setEditingUser(null)
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setEditLoading(false) }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/kullanicilar?id=${deleteUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      success('Kullanıcı silindi')
      setDeleteUser(null)
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setDeleting(false) }
  }

  async function openPermModal(u: UserRow) {
    setPermUser(u)
    setPermLoading(true)
    try {
      const res = await fetch(`/api/superadmin/kullanicilar/${u.id}/yetkiler`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPermData({
        roleId: data.roleId ?? null,
        rolePerms: data.rolePerms.map((rp: any) => rp.key),
        addedPerms: data.customPerms.filter((cp: any) => cp.granted).map((cp: any) => cp.key),
        removedPerms: data.customPerms.filter((cp: any) => !cp.granted).map((cp: any) => cp.key),
      })
    } catch { error('Yetki bilgileri yüklenemedi') }
    finally { setPermLoading(false) }
  }

  async function savePermissions() {
    if (!permUser || !permData) return
    setPermSaving(true)
    try {
      const res = await fetch(`/api/superadmin/kullanicilar/${permUser.id}/yetkiler`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: permData.roleId,
          addedPerms: permData.addedPerms,
          removedPerms: permData.removedPerms,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      success('Yetkiler güncellendi')
      setPermUser(null)
      setPermData(null)
      fetchAll()
    } catch (err: any) { error(err.message) }
    finally { setPermSaving(false) }
  }

  // Yetki toggle helper
  function togglePermInModal(key: string, source: 'add' | 'remove') {
    if (!permData) return
    if (source === 'add') {
      const added = permData.addedPerms.includes(key)
        ? permData.addedPerms.filter(p => p !== key)
        : [...permData.addedPerms, key]
      const removed = permData.removedPerms.filter(p => p !== key)
      setPermData({ ...permData, addedPerms: added, removedPerms: removed })
    } else {
      const removed = permData.removedPerms.includes(key)
        ? permData.removedPerms.filter(p => p !== key)
        : [...permData.removedPerms, key]
      const added = permData.addedPerms.filter(p => p !== key)
      setPermData({ ...permData, addedPerms: added, removedPerms: removed })
    }
  }

  // Modüle göre yetkileri grupla
  const groupedPerms = allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = []
    acc[p.module].push(p)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center">
            <User size={20} className="text-[#f7931a]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Kullanıcılar</h1>
            <p className="text-xs text-[#606080]">Sistem kullanıcılarını yönet</p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7931a]/10 text-[#f7931a] border border-[#f7931a]/20">
            {users.length}
          </span>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Yeni Kullanıcı
        </button>
      </div>

      {/* Onay Bekleyenler Bandı */}
      {pending.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">{pending.length} kullanıcı onay bekliyor</span>
          </div>
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-[#0a0a14] rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-white">{u.name}</span>
                  <span className="text-xs text-[#606080] ml-2">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(u.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs hover:bg-green-500/20 transition-colors">
                    <Check size={12} /> Onayla
                  </button>
                  <button onClick={() => setDeleteUser(u)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 transition-colors">
                    <X size={12} /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#606080]">
            <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Yükleniyor...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <User size={36} className="text-[#1e1e35]" />
            <p className="text-[#606080] text-sm">Henüz veri yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Ad Soyad</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Email</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Rol</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Şablon</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">Durum</th>
                  <th className="text-left px-5 py-3.5 text-[#606080] font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#1e1e35]/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f7931a]/10 flex items-center justify-center text-xs font-bold text-[#f7931a]">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                        {u.id === currentUserId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f7931a]/10 text-[#f7931a]">Siz</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#606080]">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[u.systemRole] ?? ROLE_COLORS.EDITOR}`}>
                        {ROLE_LABELS[u.systemRole] ?? u.systemRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#606080] text-xs">
                      {u.roleTemplate?.name ?? <span className="text-[#404060]">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.active ? (
                        <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Aktif</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />Beklemede</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e35] hover:bg-[#f7931a]/10 hover:text-[#f7931a] text-[#606080] text-xs transition-colors">
                          <Pencil size={13} /> Düzenle
                        </button>
                        {u.systemRole !== 'SUPERADMIN' && (
                          <button onClick={() => openPermModal(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e35] hover:bg-[#a78bfa]/10 hover:text-[#a78bfa] text-[#606080] text-xs transition-colors">
                            <ShieldCheck size={13} /> Yetkiler
                          </button>
                        )}
                        <button onClick={() => setDeleteUser(u)} disabled={u.id === currentUserId}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e35] hover:bg-red-500/10 hover:text-red-400 text-[#606080] text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 size={13} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Kullanıcı Ekle" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Ad Soyad</label>
            <input className={INPUT} placeholder="Ahmet Yılmaz" value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Email</label>
            <input type="email" className={INPUT} placeholder="ahmet@ornek.com" value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Şifre</label>
            <div className="relative">
              <input type={showAddPw ? 'text' : 'password'} className={INPUT + ' pr-20'} placeholder="••••••••"
                value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                <button type="button" onClick={() => setAddForm({ ...addForm, password: generatePassword() })}
                  className="text-[10px] px-2 py-1 rounded bg-[#1e1e35] text-[#f7931a] hover:bg-[#f7931a]/10 transition-colors whitespace-nowrap">Üret</button>
                <button type="button" onClick={() => setShowAddPw(!showAddPw)} className="text-[#606080] hover:text-white p-1">
                  {showAddPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Sistem Rolü</label>
            <select className={INPUT} value={addForm.systemRole} onChange={(e) => setAddForm({ ...addForm, systemRole: e.target.value })}>
              <option value="EDITOR">Editör</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">SuperAdmin</option>
            </select>
          </div>
          <p className="text-xs text-[#606080] bg-[#0a0a14] rounded-lg px-3 py-2 border border-[#1e1e35]">
            ℹ️ SuperAdmin harici kullanıcılar onaylandıktan sonra sisteme giriş yapabilir.
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors">İptal</button>
            <button type="submit" disabled={addLoading}
              className="flex-1 py-2.5 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {addLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Kullanıcıyı Düzenle" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Ad Soyad</label>
            <input className={INPUT} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Email</label>
            <input type="email" className={INPUT} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-[#606080] mb-1.5">Sistem Rolü</label>
            <select className={INPUT} value={editForm.systemRole} onChange={(e) => setEditForm({ ...editForm, systemRole: e.target.value })}>
              <option value="EDITOR">Editör</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERADMIN">SuperAdmin</option>
            </select>
          </div>
          {!showNewPwField ? (
            <button type="button" onClick={() => setShowNewPwField(true)} className="text-xs text-[#f7931a] hover:underline">Şifre Sıfırla</button>
          ) : (
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Yeni Şifre</label>
              <div className="relative">
                <input type={showEditPw ? 'text' : 'password'} className={INPUT + ' pr-20'} placeholder="Yeni şifre girin"
                  value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                  <button type="button" onClick={() => setEditForm({ ...editForm, newPassword: generatePassword() })}
                    className="text-[10px] px-2 py-1 rounded bg-[#1e1e35] text-[#f7931a] hover:bg-[#f7931a]/10 transition-colors">Üret</button>
                  <button type="button" onClick={() => setShowEditPw(!showEditPw)} className="text-[#606080] hover:text-white p-1">
                    {showEditPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditingUser(null)}
              className="flex-1 py-2.5 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors">İptal</button>
            <button type="submit" disabled={editLoading}
              className="flex-1 py-2.5 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Yetki Modal */}
      <Modal open={!!permUser} onClose={() => { setPermUser(null); setPermData(null) }} title={`Yetki Ayarları: ${permUser?.name ?? ''}`} size="lg">
        {permLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-[#606080]">
            <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Yükleniyor...</span>
          </div>
        ) : permData ? (
          <div className="space-y-5">
            {/* Rol Şablonu Seçimi */}
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Rol Şablonu</label>
              <select className={INPUT} value={permData.roleId ?? ''}
                onChange={(e) => {
                  const rid = e.target.value || null
                  const rolePms = rid ? (roles.find(r => r.id === rid)?.permissions.map(rp => `${rp.permission.module}:${rp.permission.action}`) ?? []) : []
                  setPermData({ ...permData, roleId: rid, rolePerms: rolePms })
                }}>
                <option value="">— Şablon seç —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {/* Şablon yetkileri özeti */}
            {permData.rolePerms.length > 0 && (
              <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-4 py-3">
                <p className="text-xs text-[#606080] mb-2">Şablon yetkileri:</p>
                <div className="flex flex-wrap gap-1.5">
                  {permData.rolePerms.map(k => (
                    <span key={k} className={`text-[10px] px-2 py-0.5 rounded font-mono ${permData.removedPerms.includes(k) ? 'bg-red-500/10 text-red-400 line-through' : 'bg-[#1e1e35] text-[#a0a0c0]'}`}>{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Modül bazlı yetki toggle */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(groupedPerms).map(([module, perms]) => (
                <div key={module} className="bg-[#0a0a14] border border-[#1e1e35] rounded-lg p-3">
                  <p className="text-xs font-medium text-[#a0a0c0] mb-2">{MODULE_LABELS[module] ?? module}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {perms.map(p => {
                      const key = `${p.module}:${p.action}`
                      const inRole    = permData.rolePerms.includes(key)
                      const isAdded   = permData.addedPerms.includes(key)
                      const isRemoved = permData.removedPerms.includes(key)
                      const effective = (inRole && !isRemoved) || isAdded

                      return (
                        <button key={p.id} type="button"
                          onClick={() => {
                            if (inRole) {
                              // Şablon yetkisini kaldır/geri al
                              togglePermInModal(key, 'remove')
                            } else {
                              // Özel yetki ekle/kaldır
                              togglePermInModal(key, 'add')
                            }
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            effective
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-[#1e1e35] text-[#606080] border border-transparent hover:border-[#2e2e55]'
                          }`}>
                          <span className={`w-3 h-3 rounded flex-shrink-0 flex items-center justify-center ${effective ? 'bg-green-500/20' : 'bg-[#2e2e55]'}`}>
                            {effective && <Check size={8} />}
                          </span>
                          {p.label}
                          {inRole && !isRemoved && <span className="ml-auto text-[8px] text-[#606080]">şablon</span>}
                          {isAdded && <span className="ml-auto text-[8px] text-blue-400">+özel</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* API Key uyarısı */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f7931a]/5 border border-[#f7931a]/20">
              <span className="text-[#f7931a] text-xs">🔒</span>
              <p className="text-xs text-[#f7931a]">API anahtarları hiçbir role veya kullanıcıya atanamazç Yalnızca SuperAdmin erişebilir.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setPermUser(null); setPermData(null) }}
                className="flex-1 py-2.5 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors">İptal</button>
              <button type="button" onClick={savePermissions} disabled={permSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {permSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete}
        title="Kullanıcıyı Sil"
        message="Bu kullanıcıyı silmek istediğinizden emin misiniz? Yazıları silinmeyecek, atanmamış hale gelecek."
        confirmLabel="Evet, Sil" danger loading={deleting} />
    </div>
  )
}
