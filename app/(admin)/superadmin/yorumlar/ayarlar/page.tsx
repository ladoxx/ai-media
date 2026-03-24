'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Settings = Record<string, string>

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#00c896]' : 'bg-[#2a2a45]'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#1e1e35] last:border-0">
      <div>
        <span className="text-sm text-[#d0d0e8]">{label}</span>
        {sub && <p className="text-xs text-[#606080] mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-5 mb-4">
      <h3 className="text-xs font-mono font-bold text-[#606080] uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function YorumAyarlariPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    fetch('/api/superadmin/yorumlar/ayarlar')
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false) })
  }, [])

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))
  const toggle = (key: string) => set(key, settings[key] === 'true' ? 'false' : 'true')
  const bool = (key: string, def = 'true') => (settings[key] ?? def) === 'true'

  const save = async () => {
    setSaving(true)
    await fetch('/api/superadmin/yorumlar/ayarlar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-[#00c896]" /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/yorumlar" className="p-2 rounded-lg bg-[#1e1e35] text-[#606080] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Yorum Ayarları</h1>
            <p className="text-sm text-[#606080] mt-0.5">Yorum sistemi yapılandırması</p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00c896] text-[#0d0d14] font-semibold text-sm hover:bg-[#00c896]/90 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>

      <Card title="Genel">
        <Row label="Yorumlar Aktif" sub="Sitewide yorum sistemi">
          <Toggle checked={bool('comment_enabled')} onChange={() => toggle('comment_enabled')} />
        </Row>
        <Row label="Onay Gerekli" sub="Yorumlar moderasyon beklesin">
          <Toggle checked={bool('comment_auto_approve', 'false')} onChange={() => toggle('comment_auto_approve')} />
        </Row>
        <Row label="Kayıtlı Kullanıcı Şart" sub="Sadece üyeler yorum yapabilir">
          <Toggle checked={bool('comment_registered_only', 'false')} onChange={() => toggle('comment_registered_only')} />
        </Row>
        <Row label="Yorum Kapatma Süresi" sub="Yazı yayından bu kadar gün sonra yorum kapanır (0=kapatma)">
          <input type="number" value={settings.comment_close_days ?? '30'} onChange={(e) => set('comment_close_days', e.target.value)}
            min="0" max="365"
            className="w-20 px-3 py-1.5 text-sm text-center rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]" />
        </Row>
      </Card>

      <Card title="Spam Koruması">
        <Row label="Honeypot" sub="Gizli alan ile bot tespiti">
          <Toggle checked={bool('comment_honeypot')} onChange={() => toggle('comment_honeypot')} />
        </Row>
        <Row label="IP Bazlı Limit" sub="Saatte maksimum yorum sayısı">
          <input type="number" value={settings.comment_ip_limit ?? '5'} onChange={(e) => set('comment_ip_limit', e.target.value)}
            min="1" max="100"
            className="w-20 px-3 py-1.5 text-sm text-center rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white focus:outline-none focus:border-[#00c896]" />
        </Row>
        <Row label="Kelime Filtresi" sub="Yasaklı kelime içeren yorumları spam say">
          <Toggle checked={bool('comment_word_filter')} onChange={() => toggle('comment_word_filter')} />
        </Row>
        <div className="pt-3">
          <p className="text-xs text-[#606080] mb-1.5">Yasaklı Kelimeler <span className="text-[#404060]">(virgülle ayır)</span></p>
          <textarea value={settings.comment_banned_words ?? ''} onChange={(e) => set('comment_banned_words', e.target.value)}
            rows={3} placeholder="spam, casino, bahis, kumar, ..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896] resize-none" />
        </div>
      </Card>

      <Card title="Email Bildirimleri">
        <Row label="Yeni Yorum Emaili" sub="Her yeni yorumda bildirim al">
          <Toggle checked={bool('comment_notify_enabled')} onChange={() => toggle('comment_notify_enabled')} />
        </Row>
        <div className="pt-3">
          <p className="text-xs text-[#606080] mb-1.5">Bildirim Email Adresi</p>
          <input type="email" value={settings.comment_notify_email ?? ''} onChange={(e) => set('comment_notify_email', e.target.value)}
            placeholder="admin@cyba.com.tr"
            className="w-full px-3 py-2 text-sm rounded-lg bg-[#0f0f1a] border border-[#2a2a45] text-white placeholder-[#606080] focus:outline-none focus:border-[#00c896]" />
        </div>
      </Card>

      <Card title="Görünüm">
        <Row label="Varsayılan Sıralama">
          <div className="flex gap-2">
            {[['newest', 'Yeniden Eskiye'], ['oldest', 'Eskiden Yeniye']].map(([v, l]) => (
              <button key={v} onClick={() => set('comment_order', v)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${(settings.comment_order ?? 'newest') === v ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Sayfa Başına Yorum">
          <div className="flex gap-1">
            {['5', '10', '20', '50'].map((n) => (
              <button key={n} onClick={() => set('comment_per_page', n)}
                className={`w-10 h-9 rounded-lg text-sm font-mono transition-colors ${(settings.comment_per_page ?? '10') === n ? 'bg-[#00c896] text-[#0d0d14] font-bold' : 'bg-[#1e1e35] text-[#a0a0c0] hover:text-white'}`}>
                {n}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Avatar Göster" sub="Gravatar entegrasyonu">
          <Toggle checked={bool('comment_show_avatar')} onChange={() => toggle('comment_show_avatar')} />
        </Row>
        <Row label="Beğeni Butonu" sub="Yorumlarda 👍 butonu">
          <Toggle checked={bool('comment_show_likes')} onChange={() => toggle('comment_show_likes')} />
        </Row>
      </Card>
    </div>
  )
}
