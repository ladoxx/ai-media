'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, Bell, ExternalLink, Check, MessageSquare, Mail, Bot, AlertTriangle, Info, Users, X } from 'lucide-react'
import Link from 'next/link'

interface AdminHeaderProps {
  title: string
  onMenuToggle?: () => void
}

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
  NEW_COMMENT:        <MessageSquare size={13} className="text-blue-400" />,
  NEW_SUBSCRIBER:     <Mail size={13} className="text-emerald-400" />,
  NEW_AFFILIATE_CLICK:<Info size={13} className="text-purple-400" />,
  AUTOMATION_SUCCESS: <Bot size={13} className="text-emerald-400" />,
  AUTOMATION_ERROR:   <Bot size={13} className="text-red-400" />,
  SYSTEM_ERROR:       <AlertTriangle size={13} className="text-red-400" />,
  NEW_USER:           <Users size={13} className="text-blue-400" />,
  LOW_DISK:           <AlertTriangle size={13} className="text-amber-400" />,
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'az önce'
  if (m < 60) return `${m}dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa önce`
  return `${Math.floor(h / 24)}g önce`
}

export function AdminHeader({ title, onMenuToggle }: AdminHeaderProps) {
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const fetchCount = useCallback(async () => {
    const res = await fetch('/api/superadmin/bildirimler/count').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setUnread(data.count ?? 0)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/superadmin/bildirimler?filter=all&page=1').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setNotifications(data.notifications?.slice(0, 6) ?? [])
      setUnread(data.unread ?? 0)
    }
  }, [])

  // Poll every 30s
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [fetchCount])

  // Fetch dropdown content on open
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/superadmin/bildirimler/${id}`, { method: 'PUT' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0f0f1a] border-b border-[#1e1e35] flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-[#606080] hover:text-white p-1.5 rounded-lg hover:bg-[#1e1e35] transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-display font-bold text-white text-base">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-[#606080] hover:text-white px-3 py-1.5 rounded-lg border border-[#1e1e35] hover:border-[#00c896]/40 transition-colors"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Siteyi Gör</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative text-[#606080] hover:text-white p-2 rounded-lg hover:bg-[#1e1e35] transition-colors cursor-pointer"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#16162a] border border-[#1e1e35] rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e35]">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bell size={14} className="text-[#00c896]" />
                  Bildirimler
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full font-bold">{unread}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[#606080] hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#606080] text-sm">
                    <Bell size={20} className="mx-auto mb-2 opacity-30" />
                    Bildirim yok
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[#1e1e35] last:border-0 hover:bg-[#0a0a14]/60 transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <span className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] ?? <Bell size={13} />}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{n.title}</p>
                        <p className="text-xs text-[#606080] line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-[#404060] mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={(e) => markRead(n.id, e)}
                          className="flex-shrink-0 p-1 text-[#606080] hover:text-emerald-400 cursor-pointer"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[#1e1e35] p-3">
                <Link
                  href="/superadmin/bildirimler"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-[#00c896] hover:underline"
                >
                  Tümünü Gör →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
