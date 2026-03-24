'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, FileText, Image, Tag, LogOut,
  ChevronDown, ChevronRight, X, Users, Key, Bot,
  DollarSign, Mail, Settings, Database, ScrollText, Globe, Menu, Palette, MessageSquare, Bell, Plug, Megaphone,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon?: React.ReactNode
  children?: { href: string; label: string }[]
}

const editorNav: NavItem[] = [
  { href: '/editor', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  {
    href: '/editor/yazilar',
    label: 'Yazılar',
    icon: <FileText size={16} />,
    children: [
      { href: '/editor/yazilar', label: 'Tüm Yazılar' },
      { href: '/editor/yazilar/yeni', label: 'Yeni Yazı' },
      { href: '/editor/yazilar?durum=DRAFT', label: 'Taslaklar' },
    ],
  },
  { href: '/editor/medya', label: 'Medya', icon: <Image size={16} /> },
  { href: '/editor/kategoriler', label: 'Kategoriler', icon: <Tag size={16} /> },
]

const superadminNav: NavItem[] = [
  { href: '/superadmin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { href: '/editor/yazilar', label: 'Yazılar (Tümü)', icon: <FileText size={16} /> },
  {
    href: '/superadmin/kullanicilar',
    label: 'Kullanıcı Yönetimi',
    icon: <Users size={16} />,
    children: [
      { href: '/superadmin/kullanicilar', label: 'Kullanıcılar' },
      { href: '/superadmin/roller', label: 'Roller & Şablonlar' },
      { href: '/superadmin/api-keys/log', label: 'Yetki Logları' },
    ],
  },
  { href: '/superadmin/api-keys', label: 'API Keys', icon: <Key size={16} /> },
  {
    href: '/superadmin/otomasyon',
    label: 'Otomasyon',
    icon: <Bot size={16} />,
    children: [
      { href: '/superadmin/otomasyon', label: 'Kontrol Paneli' },
      { href: '/superadmin/otomasyon/loglar', label: 'Loglar' },
      { href: '/superadmin/otomasyon/gorsel', label: 'Görsel Ayarları' },
    ],
  },
  {
    href: '/superadmin/ai-platformlar',
    label: 'AI Platformlar',
    icon: <Bot size={16} />,
    children: [
      { href: '/superadmin/ai-platformlar', label: 'Platform Yönetimi' },
      { href: '/superadmin/ai-platformlar/test', label: 'Test Konsolu' },
      { href: '/superadmin/ai-platformlar/istatistik', label: 'İstatistikler' },
    ],
  },
  {
    href: '/superadmin/sayfalar',
    label: 'Sayfalar',
    icon: <Globe size={16} />,
    children: [
      { href: '/superadmin/sayfalar', label: 'Tüm Sayfalar' },
      { href: '/superadmin/sayfalar/yeni', label: 'Yeni Sayfa' },
    ],
  },
  {
    href: '/superadmin/menular',
    label: 'Menüler',
    icon: <Menu size={16} />,
    children: [
      { href: '/superadmin/menular', label: 'Tüm Menüler' },
    ],
  },
  { href: '/superadmin/yorumlar', label: 'Yorumlar', icon: <MessageSquare size={16} /> },
  {
    href: '/superadmin/bildirimler',
    label: 'Bildirimler',
    icon: <Bell size={16} />,
    children: [
      { href: '/superadmin/bildirimler', label: 'Tüm Bildirimler' },
      { href: '/superadmin/bildirimler/push', label: 'Push Panel' },
      { href: '/superadmin/bildirimler/ayarlar', label: 'Ayarlar' },
    ],
  },
  {
    href: '/superadmin/reklamlar',
    label: 'Reklamlar',
    icon: <Megaphone size={16} />,
    children: [
      { href: '/superadmin/reklamlar', label: 'Genel Bakış' },
      { href: '/superadmin/reklamlar?tab=zones', label: 'Reklam Alanları' },
      { href: '/superadmin/reklamlar?tab=ads', label: 'Reklamlar' },
      { href: '/superadmin/reklamlar?tab=abtest', label: 'A/B Test' },
      { href: '/superadmin/reklamlar?tab=stats', label: 'İstatistikler' },
      { href: '/superadmin/reklamlar?tab=adsense', label: 'AdSense' },
    ],
  },
  { href: '/superadmin/gelir', label: 'Gelir Takibi', icon: <DollarSign size={16} /> },
  { href: '/superadmin/newsletter', label: 'Newsletter', icon: <Mail size={16} /> },
  { href: '/superadmin/kategoriler', label: 'Kategoriler', icon: <Tag size={16} /> },
  { href: '/superadmin/etiketler', label: 'Etiketler', icon: <Tag size={16} /> },
  {
    href: '/superadmin/pluginler',
    label: "Pluginler & Widget'lar",
    icon: <Plug size={16} />,
    children: [
      { href: '/superadmin/pluginler', label: 'Plugin Listesi' },
      { href: '/superadmin/pluginler/widgetlar', label: "Widget'lar" },
      { href: '/superadmin/pluginler/kod', label: 'Özel Kod' },
    ],
  },
  { href: '/superadmin/tema', label: 'Tema & Görünüm', icon: <Palette size={16} /> },
  { href: '/superadmin/ayarlar', label: 'Ayarlar', icon: <Settings size={16} /> },
  { href: '/superadmin/yedekleme', label: 'Yedekleme', icon: <Database size={16} /> },
]

interface AdminSidebarProps {
  user: { name: string; email: string; role: string }
  permissions?: string[]
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AdminSidebar({ user, permissions = [], mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = user.role === 'SUPERADMIN'
  const isAdmin = user.role === 'ADMIN'

  const hasWildcard = permissions.includes('*')
  const can = (module: string, action: string) =>
    isSuperAdmin || hasWildcard || permissions.includes(`${module}:${action}`)

  // Admin için yetkiye göre dinamik nav
  const adminNav: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    ...(can('content', 'view') ? [{
      href: '/admin/yazilar',
      label: 'Yazılar',
      icon: <FileText size={16} />,
      children: [
        { href: '/admin/yazilar', label: 'Tüm Yazılar' },
        ...(can('content', 'create') ? [{ href: '/admin/yazilar/yeni', label: 'Yeni Yazı' }] : []),
      ],
    }] : []),
    ...(can('automation', 'view') ? [{
      href: '/admin/otomasyon',
      label: 'Otomasyon',
      icon: <Bot size={16} />,
      children: [
        { href: '/admin/otomasyon', label: 'Kontrol Paneli' },
        ...(can('automation', 'logs') ? [{ href: '/admin/otomasyon/loglar', label: 'Loglar' }] : []),
      ],
    }] : []),
    ...(can('ads', 'view') ? [{ href: '/admin/reklamlar', label: 'Reklamlar', icon: <Megaphone size={16} /> }] : []),
    ...(can('revenue', 'view') ? [{ href: '/admin/gelir', label: 'Gelir Takibi', icon: <DollarSign size={16} /> }] : []),
    ...(can('newsletter', 'view') ? [{ href: '/admin/newsletter', label: 'Newsletter', icon: <Mail size={16} /> }] : []),
    ...(can('user', 'view') ? [{ href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: <Users size={16} /> }] : []),
  ]

  const nav = isSuperAdmin ? superadminNav : isAdmin ? adminNav : editorNav
  const accent = isSuperAdmin ? '#f7931a' : isAdmin ? '#a78bfa' : '#00c896'
  const sidebarBg = isSuperAdmin ? '#0a0a12' : '#0f0f1a'

  const [openGroups, setOpenGroups] = useState<string[]>(
    isSuperAdmin ? ['/superadmin/otomasyon'] : isAdmin ? ['/admin/yazilar'] : ['/editor/yazilar']
  )

  function toggleGroup(href: string) {
    setOpenGroups((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  function isActive(href: string) {
    const clean = href.split('?')[0]
    if (clean === '/editor' || clean === '/superadmin') return pathname === clean
    return pathname.startsWith(clean)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          w-[260px] h-screen border-r border-[#1e1e35]
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: sidebarBg }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e35]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧭</span>
              <span className="font-display font-extrabold text-white text-base">Cyba</span>
            </div>
            <p
              className="text-[10px] mt-0.5 font-mono uppercase tracking-widest pl-7"
              style={{ color: accent }}
            >
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Editor'} Panel
            </p>
          </div>
          <button onClick={onMobileClose} className="lg:hidden text-[#606080] hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item.href)
            const groupOpen = openGroups.includes(item.href)

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                    style={active ? { color: accent, background: `${accent}18` } : undefined}
                  >
                    {active && (
                      <span
                        className="absolute left-0 w-0.5 h-6 rounded-r"
                        style={{ background: accent }}
                      />
                    )}
                    <span className={active ? '' : 'text-[#606080]'}>{item.icon}</span>
                    <span
                      className={`flex-1 text-left font-medium ${active ? '' : 'text-[#606080] hover:text-white'}`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[#606080]">
                      {groupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  {groupOpen && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-[#1e1e35] pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href.split('?')[0]
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onMobileClose}
                            className="block px-3 py-1.5 rounded-lg text-xs transition-colors"
                            style={childActive ? { color: accent, background: `${accent}10` } : undefined}
                          >
                            <span className={childActive ? '' : 'text-[#606080] hover:text-white'}>
                              {child.label}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={active ? { color: accent, background: `${accent}18` } : undefined}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                    style={{ background: accent }}
                  />
                )}
                <span className={active ? '' : 'text-[#606080]'}>{item.icon}</span>
                <span className={`font-medium ${active ? '' : 'text-[#606080] hover:text-white'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + sign out */}
        <div className="p-3 border-t border-[#1e1e35] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1e1e35]/40">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${accent}20`, color: accent }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#606080] truncate">{user.email}</p>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${accent}10`, color: accent }}
            >
              {user.role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#606080] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={15} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  )
}
