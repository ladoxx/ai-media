'use client'

import { useState, useEffect } from 'react'
import { Save, Mail, Bell, Send } from 'lucide-react'

interface Settings {
  notif_email_enabled: string
  notif_email_new_comment: string
  notif_email_new_subscriber: string
  notif_email_auto_error: string
  notif_email_system_error: string
  notif_admin_email: string
  notif_email_digest: string
  notif_push_enabled: string
  notif_push_delay: string
  notif_push_max_shows: string
  notif_bell_new_comment: string
  notif_bell_new_subscriber: string
  notif_bell_auto_success: string
  notif_bell_auto_error: string
  notif_bell_affiliate: string
  [key: string]: string
}

const DEFAULTS: Settings = {
  notif_email_enabled: 'true',
  notif_email_new_comment: 'true',
  notif_email_new_subscriber: 'false',
  notif_email_auto_error: 'true',
  notif_email_system_error: 'true',
  notif_admin_email: 'admin@cyba.com.tr',
  notif_email_digest: 'daily',
  notif_push_enabled: 'true',
  notif_push_delay: '10',
  notif_push_max_shows: '1',
  notif_bell_new_comment: 'true',
  notif_bell_new_subscriber: 'true',
  notif_bell_auto_success: 'true',
  notif_bell_auto_error: 'true',
  notif_bell_affiliate: 'false',
}

const inputBase = 'w-full px-3 py-2 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896]'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-[#00c896]' : 'bg-[#1e1e35]'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#1e1e35] last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-xs text-[#606080] mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#00c896]">{icon}</span>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function BildirimlerAyarlarPage() {
  const [cfg, setCfg] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [testPush, setTestPush] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/superadmin/bildirimler/ayarlar')
      .then((r) => r.json())
      .then((data) => setCfg({ ...DEFAULTS, ...data }))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: string) => setCfg((prev) => ({ ...prev, [key]: value }))
  const toggle = (key: string) => set(key, cfg[key] === 'true' ? 'false' : 'true')
  const on = (key: string) => cfg[key] !== 'false'

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/superadmin/bildirimler/ayarlar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
    setSaving(false)
    setMessage(res.ok ? { type: 'success', text: 'Ayarlar kaydedildi.' } : { type: 'error', text: 'Hata oluştu.' })
    setTimeout(() => setMessage(null), 3000)
  }

  const sendTestEmail = async () => {
    setTestEmail('sending')
    const res = await fetch('/api/superadmin/bildirimler/ayarlar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cfg, _testEmail: 'true' }),
    })
    setTestEmail(res.ok ? 'ok' : 'err')
    setTimeout(() => setTestEmail('idle'), 3000)
  }

  const sendTestPush = async () => {
    setTestPush('sending')
    const res = await fetch('/api/superadmin/bildirimler/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Bildirimi', body: 'Cyba push bildirimleri çalışıyor!', url: '/' }),
    })
    setTestPush(res.ok ? 'ok' : 'err')
    setTimeout(() => setTestPush('idle'), 3000)
  }

  if (loading) return <div className="p-8 text-center text-[#606080] text-sm">Yükleniyor...</div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Bildirim Ayarları</h1>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-xs px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00c896] text-[#0a0a14] font-semibold text-sm rounded-lg hover:bg-[#00c896]/90 disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Admin Bell Notifications */}
      <Card title="Admin Panel Bildirimleri" icon={<Bell size={16} />}>
        <Row label="Yeni yorum" desc="Yorum gelince admin panelde göster">
          <Toggle checked={on('notif_bell_new_comment')} onChange={() => toggle('notif_bell_new_comment')} />
        </Row>
        <Row label="Yeni abone" desc="Bülten aboneliğinde bildirim">
          <Toggle checked={on('notif_bell_new_subscriber')} onChange={() => toggle('notif_bell_new_subscriber')} />
        </Row>
        <Row label="Otomasyon tamamlandı">
          <Toggle checked={on('notif_bell_auto_success')} onChange={() => toggle('notif_bell_auto_success')} />
        </Row>
        <Row label="Otomasyon hatası">
          <Toggle checked={on('notif_bell_auto_error')} onChange={() => toggle('notif_bell_auto_error')} />
        </Row>
        <Row label="Affiliate tıklama" desc="Her tıklamada bildirim (yoğun olabilir)">
          <Toggle checked={on('notif_bell_affiliate')} onChange={() => toggle('notif_bell_affiliate')} />
        </Row>
      </Card>

      {/* Email Notifications */}
      <Card title="Email Bildirimleri" icon={<Mail size={16} />}>
        <Row label="Email bildirimleri aktif">
          <Toggle checked={on('notif_email_enabled')} onChange={() => toggle('notif_email_enabled')} />
        </Row>
        <Row label="Bildirim email adresi">
          <input
            type="email"
            value={cfg.notif_admin_email}
            onChange={(e) => set('notif_admin_email', e.target.value)}
            className="w-56 px-3 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896]"
          />
        </Row>
        <Row label="Yeni yorum" desc="Onay bekleyen yorum bildirimi">
          <Toggle checked={on('notif_email_new_comment')} onChange={() => toggle('notif_email_new_comment')} />
        </Row>
        <Row label="Yeni abone">
          <Toggle checked={on('notif_email_new_subscriber')} onChange={() => toggle('notif_email_new_subscriber')} />
        </Row>
        <Row label="Otomasyon hatası">
          <Toggle checked={on('notif_email_auto_error')} onChange={() => toggle('notif_email_auto_error')} />
        </Row>
        <Row label="Sistem hatası">
          <Toggle checked={on('notif_email_system_error')} onChange={() => toggle('notif_email_system_error')} />
        </Row>
        <Row label="Email özeti">
          <select
            value={cfg.notif_email_digest}
            onChange={(e) => set('notif_email_digest', e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896]"
          >
            <option value="instant">Anlık</option>
            <option value="hourly">Saatlik özet</option>
            <option value="daily">Günlük özet</option>
          </select>
        </Row>
      </Card>

      {/* Push Settings */}
      <Card title="Push Bildirim Ayarları (Site)" icon={<Bell size={16} />}>
        <Row label="Push bildirimler aktif">
          <Toggle checked={on('notif_push_enabled')} onChange={() => toggle('notif_push_enabled')} />
        </Row>
        <Row label="Ne zaman göster">
          <select
            value={cfg.notif_push_delay}
            onChange={(e) => set('notif_push_delay', e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896]"
          >
            <option value="0">Hemen</option>
            <option value="10">10 saniye sonra</option>
            <option value="30">30 saniye sonra</option>
            <option value="scroll">Scroll sonra</option>
          </select>
        </Row>
        <Row label="Kaç kez göster">
          <input
            type="number"
            value={cfg.notif_push_max_shows}
            onChange={(e) => set('notif_push_max_shows', e.target.value)}
            min={1}
            max={10}
            className="w-20 px-3 py-1.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#00c896]"
          />
        </Row>
      </Card>

      {/* Test */}
      <Card title="Test Gönderimi" icon={<Send size={16} />}>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={sendTestEmail}
            disabled={testEmail === 'sending'}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a0a14] border border-[#1e1e35] text-sm text-white rounded-lg hover:border-[#00c896] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Mail size={14} />
            {testEmail === 'sending' ? 'Gönderiliyor...' : testEmail === 'ok' ? '✅ Gönderildi' : testEmail === 'err' ? '❌ Hata' : '📧 Test Email'}
          </button>
          <button
            type="button"
            onClick={sendTestPush}
            disabled={testPush === 'sending'}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a0a14] border border-[#1e1e35] text-sm text-white rounded-lg hover:border-[#00c896] disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Bell size={14} />
            {testPush === 'sending' ? 'Gönderiliyor...' : testPush === 'ok' ? '✅ Gönderildi' : testPush === 'err' ? '❌ Hata' : '🔔 Test Push'}
          </button>
        </div>
      </Card>
    </div>
  )
}
