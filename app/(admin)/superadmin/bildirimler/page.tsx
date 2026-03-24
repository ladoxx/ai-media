'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Mail, Check, CheckCheck, Trash2, MessageSquare, Users, Bot, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  NEW_COMMENT:        <MessageSquare size={14} className="text-blue-400" />,
  NEW_SUBSCRIBER:     <Mail size={14} className="text-emerald-400" />,
  NEW_AFFILIATE_CLICK:<Info size={14} className="text-purple-400" />,
  AUTOMATION_SUCCESS: <Bot size={14} className="text-emerald-400" />,
  AUTOMATION_ERROR:   <Bot size={14} className="text-red-400" />,
  SYSTEM_ERROR:       <AlertTriangle size={14} className="text-red-400" />,
  NEW_USER:           <Users size={14} className="text-blue-400" />,
  LOW_DISK:           <AlertTriangle size={14} className="text-amber-400" />,
}

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'comments', label: 'Yorumlar' },
  { key: 'subscribers', label: 'Aboneler' },
  { key: 'automation', label: 'Otomasyon' },
  { key: 'system', label: 'Sistem' },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'az önce'
  if (m < 60) return `${m}dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa önce`
  return `${Math.floor(h / 24)}g önce`
}

function isError(type: string) {
  return type === 'AUTOMATION_ERROR' || type === 'SYSTEM_ERROR' || type === 'LOW_DISK'
}

export default function BildirimlerPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/superadmin/bildirimler?filter=${filter}`)
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications)
      setUnread(data.unread)
      setTotal(data.total)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const markAllRead = async () => {
    await fetch('/api/superadmin/bildirimler', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) })
    load()
  }

  const markRead = async (id: string) => {
    await fetch(`/api/superadmin/bildirimler/${id}`, { method: 'PUT' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((u) => Math.max(0, u - 1))
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/api/superadmin/bildirimler/${id}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setTotal((t) => t - 1)
  }

  const readCount = total - unread

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Bell size={18} />, label: 'Tümü', value: total, color: 'text-white' },
          { icon: <Bell size={18} />, label: 'Okunmamış', value: unread, color: 'text-amber-400' },
          { icon: <Check size={18} />, label: 'Okunan', value: readCount, color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-4 flex items-center gap-3">
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-[#606080]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${filter === f.key ? 'bg-[#00c896] text-[#0a0a14] font-semibold' : 'bg-[#16162a] text-[#606080] hover:text-white border border-[#1e1e35]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              Tümünü Okundu İşaretle
            </button>
          )}
          <Link
            href="/superadmin/bildirimler/ayarlar"
            className="px-3 py-1.5 text-sm bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg transition-colors"
          >
            Ayarlar
          </Link>
          <Link
            href="/superadmin/bildirimler/push"
            className="px-3 py-1.5 text-sm bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg transition-colors"
          >
            Push Panel
          </Link>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#606080] text-sm">Yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-[#606080]">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>Bildirim yok</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e35]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 hover:bg-[#0a0a14]/50 transition-colors ${!n.read ? (isError(n.type) ? 'border-l-2 border-red-500' : 'border-l-2 border-blue-500') : ''}`}
              >
                <div className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] ?? <Bell size={14} />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{n.title}</span>
                    {!n.read && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                    )}
                    <span className="text-xs text-[#606080] ml-auto flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#a0a0c0]">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#00c896] hover:underline"
                    >
                      Görüntüle <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      title="Okundu işaretle"
                      className="p-1.5 text-[#606080] hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotif(n.id)}
                    title="Sil"
                    className="p-1.5 text-[#606080] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
