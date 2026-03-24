'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

type Tab = 'genel' | 'adsense' | 'sosyal' | 'guvenlik'

interface Settings {
  site_title: string
  site_desc: string
  site_url: string
  footer_text: string
  adsense_publisher: string
  adsense_header: string
  adsense_article: string
  adsense_sidebar: string
  adsense_enabled: string
  telegram_channel: string
  twitter_username: string
  instagram_username: string
  youtube_channel: string
}

export default function AyarlarPage() {
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<Tab>('genel')
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/ayarlar')
      .then((r) => r.json())
      .then((data) => { setSettings(data.settings ?? {}); setLoading(false) })
  }, [])

  function set(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save(keys: (keyof Settings)[]) {
    setSaving(true)
    const partial = Object.fromEntries(keys.map((k) => [k, settings[k] ?? '']))
    const res = await fetch('/api/superadmin/ayarlar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: partial }),
    })
    setSaving(false)
    if (res.ok) success('Ayarlar kaydedildi')
    else toastError('Kayıt sırasında hata oluştu')
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm'
  const labelClass = 'block text-xs text-[#606080] mb-1.5'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'genel', label: 'Genel' },
    { key: 'adsense', label: 'AdSense' },
    { key: 'sosyal', label: 'Sosyal Medya' },
    { key: 'guvenlik', label: 'Güvenlik' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#606080]">
      <Loader2 size={20} className="animate-spin mr-2" /> Yükleniyor...
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-xl text-white mb-6">Site Ayarları</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#16162a] border border-[#1e1e35] rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#f7931a] text-[#0a0a14]'
                : 'text-[#606080] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-6 space-y-5">
        {tab === 'genel' && (
          <>
            <div>
              <label className={labelClass}>Site Başlığı</label>
              <input className={inputClass} value={settings.site_title ?? ''} onChange={(e) => set('site_title', e.target.value)} placeholder="Cyba" />
            </div>
            <div>
              <label className={labelClass}>Site Açıklaması</label>
              <input className={inputClass} value={settings.site_desc ?? ''} onChange={(e) => set('site_desc', e.target.value)} placeholder="Teknoloji • Kripto • Gayrimenkul • Oyun" />
            </div>
            <div>
              <label className={labelClass}>Site URL</label>
              <input className={inputClass} value={settings.site_url ?? ''} onChange={(e) => set('site_url', e.target.value)} placeholder="https://cyba.com.tr" />
            </div>
            <div>
              <label className={labelClass}>Footer Metni</label>
              <input className={inputClass} value={settings.footer_text ?? ''} onChange={(e) => set('footer_text', e.target.value)} placeholder="© 2025 Cyba. Tüm hakları saklıdır." />
            </div>
            <SaveButton saving={saving} onClick={() => save(['site_title', 'site_desc', 'site_url', 'footer_text'])} />
          </>
        )}

        {tab === 'adsense' && (
          <>
            <div className="flex items-center justify-between p-3 bg-[#0a0a14] rounded-lg border border-[#1e1e35]">
              <span className="text-sm text-white">Reklamları Etkinleştir</span>
              <button
                onClick={() => set('adsense_enabled', settings.adsense_enabled === '1' ? '0' : '1')}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  settings.adsense_enabled === '1' ? 'bg-[#f7931a]' : 'bg-[#1e1e35]'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.adsense_enabled === '1' ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div>
              <label className={labelClass}>Publisher ID</label>
              <input className={inputClass} value={settings.adsense_publisher ?? ''} onChange={(e) => set('adsense_publisher', e.target.value)} placeholder="pub-XXXXXXXXXXXXXXXXX" />
            </div>
            <div>
              <label className={labelClass}>Header Altı (728×90) — Reklam Kodu</label>
              <textarea rows={3} className={inputClass + ' resize-none'} value={settings.adsense_header ?? ''} onChange={(e) => set('adsense_header', e.target.value)} placeholder="<ins class=...>" />
            </div>
            <div>
              <label className={labelClass}>Makale İçi (336×280)</label>
              <textarea rows={3} className={inputClass + ' resize-none'} value={settings.adsense_article ?? ''} onChange={(e) => set('adsense_article', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Sidebar (300×250)</label>
              <textarea rows={3} className={inputClass + ' resize-none'} value={settings.adsense_sidebar ?? ''} onChange={(e) => set('adsense_sidebar', e.target.value)} />
            </div>
            <SaveButton saving={saving} onClick={() => save(['adsense_enabled', 'adsense_publisher', 'adsense_header', 'adsense_article', 'adsense_sidebar'])} />
          </>
        )}

        {tab === 'sosyal' && (
          <>
            {[
              { key: 'telegram_channel' as const, label: 'Telegram Kanal Linki', placeholder: 'https://t.me/cyba' },
              { key: 'twitter_username' as const, label: 'Twitter Kullanıcı Adı', placeholder: '@cyba' },
              { key: 'instagram_username' as const, label: 'Instagram Kullanıcı Adı', placeholder: '@cyba' },
              { key: 'youtube_channel' as const, label: 'YouTube Kanal Linki', placeholder: 'https://youtube.com/@...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input className={inputClass} value={settings[key] ?? ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
            <SaveButton saving={saving} onClick={() => save(['telegram_channel', 'twitter_username', 'instagram_username', 'youtube_channel'])} />
          </>
        )}

        {tab === 'guvenlik' && (
          <>
            <p className="text-xs text-[#606080]">Hesabınızın şifresini değiştirin.</p>
            <div>
              <label className={labelClass}>Yeni Şifre</label>
              <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelClass}>Şifre Tekrar</label>
              <input type="password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button
              onClick={async () => {
                if (newPassword !== confirmPassword) { toastError('Şifreler eşleşmiyor'); return }
                if (newPassword.length < 8) { toastError('Şifre en az 8 karakter olmalı'); return }
                setSaving(true)
                const res = await fetch('/api/superadmin/ayarlar', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ changePassword: newPassword }),
                })
                setSaving(false)
                if (res.ok) { success('Şifre güncellendi'); setNewPassword(''); setConfirmPassword('') }
                else toastError('Şifre güncellenemedi')
              }}
              disabled={saving || !newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-[#0a0a14] font-semibold rounded-lg text-sm hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Şifreyi Güncelle
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 bg-[#f7931a] text-[#0a0a14] font-semibold rounded-lg text-sm hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors mt-2"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {saving ? 'Kaydediliyor...' : 'Kaydet'}
    </button>
  )
}
