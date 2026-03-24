'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Power, PowerOff, X, Save } from 'lucide-react'
import type { PluginField } from '@/lib/plugin-defs'
import Link from 'next/link'

interface PluginInfo {
  slug: string
  name: string
  description: string
  version: string
  icon: string
  active: boolean
  settings: string
}

interface SchemaField extends PluginField { value: string }

// Fetch settings schema from registry (client-safe copy)
const FIELD_SCHEMAS: Record<string, PluginField[]> = {
  adsense: [
    { key: 'publisher_id', label: 'Publisher ID', type: 'text', placeholder: 'ca-pub-XXXXXXXXXXXXXXXX' },
    { key: 'auto_ads', label: 'Auto Ads', type: 'toggle', defaultValue: 'true' },
    { key: 'header_ad', label: 'Header (728x90)', type: 'toggle', defaultValue: 'true' },
    { key: 'article_ad', label: 'Makale içi reklam', type: 'toggle', defaultValue: 'true' },
    { key: 'sidebar_ad', label: 'Sidebar reklamı', type: 'toggle', defaultValue: 'true' },
    { key: 'footer_ad', label: 'Footer reklamı', type: 'toggle', defaultValue: 'false' },
  ],
  analytics: [
    { key: 'measurement_id', label: 'Measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
    { key: 'track_scroll', label: 'Scroll takibi', type: 'toggle', defaultValue: 'true' },
    { key: 'track_outbound', label: 'Dış link tıklama', type: 'toggle', defaultValue: 'true' },
    { key: 'track_search', label: 'Arama takibi', type: 'toggle', defaultValue: 'true' },
  ],
  hotjar: [
    { key: 'site_id', label: 'Site ID', type: 'text', placeholder: '1234567' },
  ],
  'facebook-pixel': [
    { key: 'pixel_id', label: 'Pixel ID', type: 'text', placeholder: 'XXXXXXXXXXXXXXXXXX' },
  ],
  'crypto-ticker': [
    { key: 'coins', label: 'Coinler (virgülle)', type: 'text', placeholder: 'bitcoin,ethereum,binancecoin,solana', defaultValue: 'bitcoin,ethereum,binancecoin,solana' },
    { key: 'currency', label: 'Para birimi', type: 'select', defaultValue: 'usd', options: [{ value: 'usd', label: 'USD' }, { value: 'eur', label: 'EUR' }, { value: 'try', label: 'TRY' }] },
    { key: 'refresh', label: 'Güncelleme (saniye)', type: 'select', defaultValue: '30', options: [{ value: '10', label: '10sn' }, { value: '30', label: '30sn' }, { value: '60', label: '1dk' }] },
  ],
  'cookie-consent': [
    { key: 'message', label: 'Mesaj', type: 'textarea', defaultValue: 'Bu site çerez kullanmaktadır.' },
    { key: 'button_text', label: 'Buton metni', type: 'text', defaultValue: 'Kabul Et' },
    { key: 'policy_url', label: 'Politika sayfası URL', type: 'text', placeholder: '/cerez-politikasi' },
    { key: 'position', label: 'Konum', type: 'select', defaultValue: 'bottom', options: [{ value: 'bottom', label: 'Alt' }, { value: 'top', label: 'Üst' }] },
  ],
  whatsapp: [
    { key: 'phone', label: 'Telefon (+90...)', type: 'text', placeholder: '+905001234567' },
    { key: 'message', label: 'Ön mesaj', type: 'textarea', defaultValue: 'Merhaba! Yardımcı olabilir miyim?' },
    { key: 'position', label: 'Konum', type: 'select', defaultValue: 'right', options: [{ value: 'right', label: 'Sağ Alt' }, { value: 'left', label: 'Sol Alt' }] },
  ],
  'social-share': [
    { key: 'show_twitter', label: 'Twitter/X', type: 'toggle', defaultValue: 'true' },
    { key: 'show_facebook', label: 'Facebook', type: 'toggle', defaultValue: 'true' },
    { key: 'show_linkedin', label: 'LinkedIn', type: 'toggle', defaultValue: 'true' },
    { key: 'show_whatsapp', label: 'WhatsApp', type: 'toggle', defaultValue: 'true' },
    { key: 'show_telegram', label: 'Telegram', type: 'toggle', defaultValue: 'true' },
    { key: 'show_copy', label: 'Bağlantı Kopyala', type: 'toggle', defaultValue: 'true' },
  ],
  'telegram-share': [
    { key: 'bot_token', label: 'Bot Token', type: 'text', placeholder: '1234567890:AAFxxxx' },
    { key: 'channel_id', label: 'Kanal ID', type: 'text', placeholder: '@cyba' },
    { key: 'message_template', label: 'Mesaj şablonu', type: 'textarea', defaultValue: '📰 {title}\n\n{excerpt}\n\n🔗 {url}' },
  ],
  'related-posts': [
    { key: 'count', label: 'Yazı sayısı', type: 'select', defaultValue: '3', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '6', label: '6' }] },
    { key: 'show_image', label: 'Kapak görseli göster', type: 'toggle', defaultValue: 'true' },
    { key: 'show_excerpt', label: 'Özet göster', type: 'toggle', defaultValue: 'false' },
  ],
}

function ToggleField({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ width: '40px', height: '22px' }}
      className={`relative rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-[#00c896]' : 'bg-[#1e1e35]'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SettingsModal({ plugin, onClose }: { plugin: PluginInfo; onClose: () => void }) {
  const schema = FIELD_SCHEMAS[plugin.slug] ?? []
  const saved: Record<string, string> = JSON.parse(plugin.settings || '{}')
  const [fields, setFields] = useState<SchemaField[]>(
    schema.map((f) => ({ ...f, value: saved[f.key] ?? f.defaultValue ?? '' }))
  )
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)

  const set = (key: string, value: string) =>
    setFields((prev) => prev.map((f) => f.key === key ? { ...f, value } : f))

  const save = async () => {
    setSaving(true)
    const settings = Object.fromEntries(fields.map((f) => [f.key, f.value]))
    await fetch(`/api/superadmin/pluginler/${plugin.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    setSaving(false)
    setOk(true)
    setTimeout(() => { setOk(false); onClose() }, 800)
  }

  const inputBase = 'w-full px-3 py-2 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896] placeholder-[#606080]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e35]">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Settings size={15} className="text-[#00c896]" />
            {plugin.icon} {plugin.name} Ayarları
          </h3>
          <button type="button" onClick={onClose} className="text-[#606080] hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {schema.length === 0 && (
            <p className="text-sm text-[#606080] text-center py-4">Bu plugin için ayar yok.</p>
          )}
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-[#606080] mb-1.5">{f.label}</label>
              {f.type === 'toggle' && (
                <div className="flex items-center gap-3">
                  <ToggleField checked={f.value !== 'false'} onChange={(v) => set(f.key, v ? 'true' : 'false')} />
                  <span className="text-xs text-[#a0a0c0]">{f.value !== 'false' ? 'Açık' : 'Kapalı'}</span>
                </div>
              )}
              {f.type === 'text' && (
                <input type="text" value={f.value} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={inputBase} />
              )}
              {f.type === 'textarea' && (
                <textarea value={f.value} onChange={(e) => set(f.key, e.target.value)} rows={3} className={`${inputBase} resize-none`} />
              )}
              {f.type === 'select' && (
                <select value={f.value} onChange={(e) => set(f.key, e.target.value)} className={inputBase}>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[#1e1e35] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#606080] hover:text-white cursor-pointer">İptal</button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {ok ? '✅ Kaydedildi' : saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PluginlerPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsPlugin, setSettingsPlugin] = useState<PluginInfo | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/pluginler')
    if (res.ok) setPlugins(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (slug: string, active: boolean) => {
    setToggling(slug)
    await fetch('/api/superadmin/pluginler', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, active }),
    })
    setPlugins((prev) => prev.map((p) => p.slug === slug ? { ...p, active } : p))
    setToggling(null)
  }

  const activeCount = plugins.filter((p) => p.active).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">🔌 Plugin Yönetimi</h1>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-[#00c896]/20 text-[#00c896] rounded-full font-semibold">{activeCount} aktif</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/superadmin/pluginler/widgetlar" className="px-3 py-1.5 text-sm bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg transition-colors">
            Widget'lar
          </Link>
          <Link href="/superadmin/pluginler/kod" className="px-3 py-1.5 text-sm bg-[#16162a] border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg transition-colors">
            Özel Kod
          </Link>
        </div>
      </div>

      {/* Plugin Grid */}
      {loading ? (
        <div className="text-center text-[#606080] text-sm py-12">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map((p) => (
            <div
              key={p.slug}
              className={`bg-[#16162a] border rounded-xl p-4 transition-colors ${p.active ? 'border-[#00c896]/30' : 'border-[#1e1e35]'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-[#606080]">{p.description}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#1e1e35] text-[#606080]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-[#606080]'}`} />
                  {p.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="text-[10px] text-[#404060] mb-3">v{p.version}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsPlugin(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#0a0a14] border border-[#1e1e35] text-[#606080] hover:text-white hover:border-[#00c896]/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings size={12} />
                  Ayarlar
                </button>
                <button
                  type="button"
                  onClick={() => toggle(p.slug, !p.active)}
                  disabled={toggling === p.slug}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                    p.active
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {p.active ? <><PowerOff size={12} /> Devre Dışı</> : <><Power size={12} /> Aktif Et</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {settingsPlugin && (
        <SettingsModal
          plugin={settingsPlugin}
          onClose={() => { setSettingsPlugin(null); load() }}
        />
      )}
    </div>
  )
}
