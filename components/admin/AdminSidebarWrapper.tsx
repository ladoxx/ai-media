'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminShellProps {
  user: { name: string; email: string; role: string; permissions?: string[] }
  children: React.ReactNode
}

const pageTitles: Record<string, string> = {
  '/editor': 'Dashboard',
  '/editor/yazilar': 'Yazılar',
  '/editor/yazilar/yeni': 'Yeni Yazı',
  '/editor/medya': 'Medya Kütüphanesi',
  '/editor/kategoriler': 'Kategoriler',
  '/superadmin': 'SuperAdmin Dashboard',
  '/superadmin/kullanicilar': 'Kullanıcı Yönetimi',
  '/superadmin/api-keys': 'API Key Yönetimi',
  '/superadmin/otomasyon': 'Otomasyon',
  '/superadmin/otomasyon/loglar': 'Otomasyon Logları',
  '/superadmin/gelir': 'Gelir Takibi',
  '/superadmin/newsletter': 'Newsletter',
  '/superadmin/kategoriler': 'Kategori Yönetimi',
  '/superadmin/ayarlar': 'Site Ayarları',
  '/superadmin/yedekleme': 'Yedekleme',
  '/superadmin/sayfalar': 'Sayfa Yönetimi',
  '/superadmin/sayfalar/yeni': 'Yeni Sayfa',
  '/superadmin/menular': 'Menü Yönetimi',
  '/superadmin/tema': 'Tema & Görünüm',
  '/superadmin/yorumlar': 'Yorum Yönetimi',
  '/superadmin/yorumlar/ayarlar': 'Yorum Ayarları',
  '/superadmin/etiketler': 'Etiket Yönetimi',
  '/superadmin/bildirimler': 'Bildirimler',
  '/superadmin/bildirimler/push': 'Push Bildirim Paneli',
  '/superadmin/bildirimler/ayarlar': 'Bildirim Ayarları',
  '/superadmin/ai-platformlar': 'AI Platform Yönetimi',
  '/superadmin/ai-platformlar/test': 'AI Test Konsolu',
  '/superadmin/ai-platformlar/istatistik': 'AI İstatistikleri',
  '/superadmin/pluginler': 'Plugin & Widget Yönetimi',
  '/superadmin/pluginler/widgetlar': 'Widget Yönetimi',
  '/superadmin/pluginler/kod': 'Özel Kod Enjeksiyonu',
  '/superadmin/reklamlar': 'Reklam Yönetimi',
}

export function AdminSidebarWrapper({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const title =
    pageTitles[pathname] ?? (
      pathname.includes('/yazilar/') ? 'Yazıyı Düzenle' :
      pathname.includes('/menular/') ? 'Menü Düzenle' :
      pathname.includes('/pluginler/') ? 'Plugin Ayarları' : 'Admin Panel'
    )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a14] w-full">
      <AdminSidebar
        user={user}
        permissions={user.permissions ?? []}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          title={title}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-auto overscroll-none">
          {children}
        </main>
      </div>
    </div>
  )
}
