'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, EyeOff, X, Save, Loader2, Lock, ShieldAlert } from 'lucide-react'

// ─── Service Definitions ──────────────────────────────────────────────────────
const SERVICES = [
  { key: 'GEMINI_API_KEY',    label: 'Gemini API',           icon: '🤖', desc: 'Google AI içerik üretimi',           howTo: 'console.cloud.google.com',          free: 'Evet (15 RPM)' },
  { key: 'YOUTUBE_API_KEY',   label: 'YouTube Data API',     icon: '📺', desc: 'Trend video takibi',                  howTo: 'console.developers.google.com',     free: 'Evet (10K/gün)' },
  { key: 'TELEGRAM_TOKEN',    label: 'Telegram Bot Token',   icon: '📡', desc: 'Kanal paylaşımı + rapor',             howTo: '@BotFather üzerinden alınır',       free: 'Evet' },
  { key: 'NEWSAPI_KEY',       label: 'NewsAPI Key',          icon: '📰', desc: 'Haber toplama',                       howTo: 'newsapi.org/register',              free: '100 istek/gün' },
  { key: 'REDDIT_CLIENT_ID',  label: 'Reddit Client ID',     icon: '👽', desc: 'Reddit haber takibi',                 howTo: 'reddit.com/prefs/apps',             free: 'Evet' },
  { key: 'REDDIT_SECRET',     label: 'Reddit Secret',        icon: '🔑', desc: 'Reddit API şifresi',                  howTo: 'reddit.com/prefs/apps ile birlikte',free: 'Evet' },
  { key: 'SMTP_HOST',         label: 'SMTP Host',            icon: '📧', desc: 'Email gönderimi sunucusu',            howTo: 'Örnek: smtp.gmail.com',             free: 'Sağlayıcıya göre' },
  { key: 'SMTP_USER',         label: 'SMTP Kullanıcı',       icon: '📧', desc: 'Email gönderici adresi',              howTo: 'Gmail adresiniz',                   free: '-' },
  { key: 'SMTP_PASS',         label: 'SMTP Şifre / App Pw',  icon: '📧', desc: 'Email şifresi veya uygulama şifresi', howTo: 'Gmail: Uygulama Şifreleri',         free: '-' },
  { key: 'GA_ID',             label: 'Google Analytics ID',  icon: '📊', desc: 'Site analitik takibi',                howTo: 'analytics.google.com',              free: 'Evet' },
] as const

interface KeyRecord { value: string; active: boolean; updatedAt: string; rawExists: boolean }
interface TestResult { ok: boolean; message: string }

// ─── Şifre Doğrulama Ekranı ──────────────────────────────────────────────────
function PasswordGate({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/api-keys/dogrula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Doğrulama başarısız')
      onSuccess(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#f7931a]/10 border border-[#f7931a]/20 flex items-center justify-center mb-4">
              <Lock size={24} className="text-[#f7931a]" />
            </div>
            <h1 className="text-lg font-bold text-white">Güvenlik Doğrulaması</h1>
            <p className="text-sm text-[#606080] text-center mt-1">
              API anahtarlarını görüntülemek için şifrenizi girin.
            </p>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-5">
            <ShieldAlert size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Her görüntüleme kayıt altına alınmaktadır.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#606080] mb-1.5">Şifre</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white placeholder-[#606080] focus:outline-none focus:border-[#f7931a] text-sm"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-[#606080] hover:text-white">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <span>❌</span>{error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pw}
              className="w-full py-2.5 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Doğrulanıyor...</> : 'Doğrula'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [tokenExpiry, setTokenExpiry]   = useState<Date | null>(null)
  const [keys, setKeys]                 = useState<Record<string, KeyRecord>>({})
  const [visibleKeys, setVisibleKeys]   = useState<Set<string>>(new Set())
  const [editingKey, setEditingKey]     = useState<string | null>(null)
  const [editValue, setEditValue]       = useState('')
  const [editVisible, setEditVisible]   = useState(false)
  const [testResults, setTestResults]   = useState<Record<string, TestResult | null>>({})
  const [testingKey, setTestingKey]     = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Token süresi kontrol — süre dolunca kapıyı tekrar göster
  useEffect(() => {
    if (!tokenExpiry) return
    const ms = tokenExpiry.getTime() - Date.now()
    if (ms <= 0) { setSessionToken(null); return }
    const t = setTimeout(() => setSessionToken(null), ms)
    return () => clearTimeout(t)
  }, [tokenExpiry])

  const loadKeys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/api-keys')
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return }
        throw new Error('Anahtarlar yüklenemedi')
      }
      const data: Array<KeyRecord & { name: string }> = await res.json()
      const map: Record<string, KeyRecord> = {}
      for (const item of data) {
        map[item.name] = { value: item.value, active: item.active, updatedAt: item.updatedAt, rawExists: item.rawExists }
      }
      setKeys(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (sessionToken) loadKeys() }, [sessionToken, loadKeys])

  function handleAuth(token: string) {
    setSessionToken(token)
    setTokenExpiry(new Date(Date.now() + 10 * 60 * 1000))
  }

  function toggleVisibility(keyName: string) {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(keyName)) { next.delete(keyName) }
      else {
        next.add(keyName)
        // Görüntüleme logu kaydet
        fetch('/api/superadmin/api-keys/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyName }),
        }).catch(() => {})
      }
      return next
    })
  }

  function startEdit(keyName: string) { setEditingKey(keyName); setEditValue(''); setEditVisible(false) }
  function cancelEdit() { setEditingKey(null); setEditValue(''); setEditVisible(false) }

  async function saveKey() {
    if (!editingKey) return
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingKey, value: editValue }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Kaydetme başarısız')
      }
      await loadKeys()
      cancelEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme sırasında hata')
    } finally {
      setSaving(false)
    }
  }

  async function testKey(keyName: string) {
    setTestingKey(keyName)
    setTestResults(prev => ({ ...prev, [keyName]: null }))
    try {
      const res = await fetch('/api/superadmin/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: keyName }),
      })
      const data = await res.json()
      setTestResults(prev => ({ ...prev, [keyName]: { ok: res.ok && data.ok !== false, message: data.message ?? 'Sonuç alındı' } }))
    } catch {
      setTestResults(prev => ({ ...prev, [keyName]: { ok: false, message: 'Bağlantı hatası' } }))
    } finally {
      setTestingKey(null)
    }
  }

  // Token yoksa şifre kapısını göster
  if (!sessionToken) return <PasswordGate onSuccess={handleAuth} />

  const remainingMin = tokenExpiry ? Math.max(0, Math.ceil((tokenExpiry.getTime() - Date.now()) / 60000)) : 0

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#f0f0fa] p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-[#f7931a]">API</span> Anahtarları
          </h1>
          <p className="text-sm text-[#606080] mt-0.5">
            Entegrasyon servislerinizin API anahtarlarını güvenli şekilde yönetin
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
          <Lock size={12} />
          Oturum: {remainingMin} dk kaldı
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-[#f7931a]/40 bg-[#f7931a]/10">
        <ShieldAlert size={16} className="text-[#f7931a] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#f7931a]">
          Bu sayfadaki bilgiler gizlidir. Her anahtar görüntülemesi kayıt altına alınır. API anahtarlarınızı kimseyle paylaşmayın.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-red-400/40 bg-red-400/10 text-sm text-red-400">
          <span>❌</span><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#16162a] border border-[#1e1e35] rounded-xl h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SERVICES.map((service) => {
            const record = keys[service.key]
            const hasValue = record?.rawExists ?? false
            const isVisible = visibleKeys.has(service.key)
            const displayValue = record?.value ?? '(boş)'
            const isTesting = testingKey === service.key
            const testResult = testResults[service.key]

            return (
              <div key={service.key} className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-[#1e1e35]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{service.icon}</span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{service.label}</h3>
                      <p className="text-xs text-[#606080]">{service.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${hasValue ? 'bg-[#00c896]' : 'bg-red-400'}`} />
                    <span className="text-xs text-[#606080]">{hasValue ? 'Aktif' : 'Ayarlanmamış'}</span>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 text-sm font-mono bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-[#606080] overflow-hidden text-ellipsis whitespace-nowrap">
                      {isVisible ? displayValue : (hasValue ? displayValue : '(boş)')}
                    </code>
                    <button
                      onClick={() => toggleVisibility(service.key)}
                      title={isVisible ? 'Gizle' : 'Göster'}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[#1e1e35] rounded-lg text-[#606080] hover:text-[#f0f0fa] hover:border-[#f7931a]/30 transition-colors"
                    >
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-[#606080]">
                    Nereden alınır: <span className="text-[#f7931a]">{service.howTo}</span> · Ücretsiz: {service.free}
                  </p>
                  {record?.updatedAt && (
                    <p className="text-xs text-[#606080] mt-1">
                      Son güncelleme: {new Date(record.updatedAt).toLocaleDateString('tr-TR')}
                    </p>
                  )}
                  {testResult && (
                    <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${testResult.ok ? 'text-[#00c896] bg-[#00c896]/10' : 'text-red-400 bg-red-400/10'}`}>
                      {testResult.ok ? '✅' : '❌'} {testResult.message}
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-[#0a0a14]/50 flex items-center gap-2 border-t border-[#1e1e35]">
                  <button onClick={() => startEdit(service.key)}
                    className="text-xs px-3 py-1.5 border border-[#1e1e35] rounded-lg text-[#606080] hover:text-white hover:border-[#606080] transition-colors">
                    ✏️ Düzenle
                  </button>
                  <button onClick={() => testKey(service.key)} disabled={isTesting}
                    className="text-xs px-3 py-1.5 border border-[#f7931a]/30 rounded-lg text-[#f7931a] hover:bg-[#f7931a]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                    {isTesting ? <><Loader2 size={12} className="animate-spin" />Test ediliyor...</> : '🔌 Test Et'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log Linki */}
      <div className="mt-6 text-right">
        <a href="/superadmin/api-keys/log"
          className="text-xs text-[#606080] hover:text-[#f7931a] transition-colors underline underline-offset-2">
          Görüntüleme Loglarını Görüntüle →
        </a>
      </div>

      {/* Edit Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit() }}>
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e35]">
              <div>
                <h2 className="text-base font-semibold text-white">Anahtarı Düzenle</h2>
                <p className="text-xs text-[#606080] mt-0.5 font-mono">{editingKey}</p>
              </div>
              <button onClick={cancelEdit} className="w-8 h-8 flex items-center justify-center text-[#606080] hover:text-white border border-[#1e1e35] rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-medium text-[#606080] mb-2">Yeni Değer</label>
              <div className="flex gap-2">
                <input
                  type={editVisible ? 'text' : 'password'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveKey() }}
                  placeholder="Yeni anahtar değerini girin..."
                  autoFocus
                  className="flex-1 bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-sm text-[#f0f0fa] placeholder-[#606080] focus:outline-none focus:border-[#f7931a]/50 font-mono"
                />
                <button type="button" onClick={() => setEditVisible(v => !v)}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-[#1e1e35] rounded-lg text-[#606080] hover:text-[#f0f0fa] transition-colors">
                  {editVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-[#606080] mt-2">Değer şifrelenerek güvenli şekilde saklanır.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e1e35]">
              <button onClick={cancelEdit} disabled={saving}
                className="text-sm px-4 py-2 border border-[#1e1e35] rounded-lg text-[#606080] hover:text-white transition-colors disabled:opacity-50">
                İptal
              </button>
              <button onClick={saveKey} disabled={saving || !editValue.trim()}
                className="text-sm px-4 py-2 bg-[#f7931a] hover:bg-[#f7931a]/90 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Kaydediliyor...</> : <><Save size={14} />Kaydet</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
