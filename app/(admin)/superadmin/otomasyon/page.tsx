'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Zap, Clock, RefreshCw, Save, Square, CheckCircle,
  AlertTriangle, Power, PowerOff, Activity, CheckSquare,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ALL_CATEGORIES } from '@/automation/config'

interface AutoStatus {
  lastRun: string | null
  nextRun: string | null
  active: boolean
  enabled: boolean
  isRunning: boolean
  runningCategory: string | null
  runStartedAt: string | null
  schedule: { sabah: string; oglen: string; aksam: string }
}

interface LogLine {
  text: string
  type: 'cmd' | 'ok' | 'err' | 'info' | 'done'
}

function getCatName(slug: string) {
  return ALL_CATEGORIES.find(c => c.slug === slug)?.name || slug
}

function getCatTime(slug: string) {
  return ALL_CATEGORIES.find(c => c.slug === slug)?.scheduleTime || ''
}

function getCatPipeline(slug: string) {
  return ALL_CATEGORIES.find(c => c.slug === slug)?.pipeline || 'news'
}

const CATEGORY_GROUPS = [
  {
    group: '💰 Finans', color: '#f7931a',
    slugs: ['finans/borsa','finans/kripto','finans/altin-doviz','finans/analizler'],
  },
  {
    group: '📊 Ekonomi', color: '#3b82f6',
    slugs: ['ekonomi/turkiye-ekonomisi','ekonomi/dunya-ekonomisi','ekonomi/enflasyon-faiz','ekonomi/sirket-haberleri'],
  },
  {
    group: '🏡 Gayrimenkul', color: '#10b981',
    slugs: ['gayrimenkul/konut-projeleri','gayrimenkul/kira-satilik','gayrimenkul/yatirim-firsatlari','gayrimenkul/tapu-hukuk','gayrimenkul/bolgesel-analiz'],
  },
  {
    group: '🎮 Oyun', color: '#a855f7',
    slugs: ['oyun/oyun-haberleri','oyun/mobil-oyunlar','oyun/pc-konsol','oyun/oyun-incelemeleri','oyun/e-spor'],
  },
  {
    group: '🤖 Teknoloji', color: '#00c896',
    slugs: ['teknoloji/yapay-zeka','teknoloji/startup','teknoloji/uygulamalar','teknoloji/donanim'],
  },
  {
    group: '📚 Rehberler (Haftalık)', color: '#f59e0b',
    slugs: ['rehberler/nasil-yapilir','rehberler/para-kazanma','rehberler/yatirim-taktikleri'],
  },
]

const ALL_SLUGS = CATEGORY_GROUPS.flatMap((g) => g.slugs)

const INPUT = 'w-full px-3 py-2.5 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-white text-sm focus:outline-none focus:border-[#f7931a]'

function classifyLine(text: string): LogLine['type'] {
  if (text.includes('❌') || text.includes('hata') || text.includes('Kritik')) return 'err'
  if (text.startsWith('[') && (text.includes('✅') || text.includes('✓') || text.includes('Tamamlandı'))) return 'ok'
  if (text.includes('🚀') || text.includes('$ ')) return 'cmd'
  if (text.includes('⚠️') && !text.includes('SSE bağlantısı kesildi')) return 'err'
  return 'info'
}

export default function OtomasyonPage() {
  const { success, error } = useToast()
  const terminalRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [status, setStatus] = useState<AutoStatus>({
    lastRun: null, nextRun: null, active: true, enabled: true,
    isRunning: false, runningCategory: null, runStartedAt: null,
    schedule: { sabah: '08:00', oglen: '13:00', aksam: '18:00' },
  })
  const [statusLoading, setStatusLoading] = useState(true)
  const [localRunning, setLocalRunning] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [enablingToggle, setEnablingToggle] = useState(false)
  const [runStats, setRunStats] = useState<{ published: number } | null>(null)
  const [disconnectedRun, setDisconnectedRun] = useState<string | null>(null)

  // Multi-select state
  const [selected, setSelected] = useState<string[]>([])
  const [queue, setQueue] = useState<string[]>([])
  const [queueIndex, setQueueIndex] = useState(0)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/otomasyon/durum')
      if (!res.ok) throw new Error()
      const data = await res.json() as AutoStatus
      setStatus(data)
    } catch {
      // silent
    } finally {
      setStatusLoading(false)
    }
  }, [])

  // Load persisted logs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('otomasyon_logs')
      if (saved) {
        const parsed = JSON.parse(saved) as LogLine[]
        if (parsed.length > 0) setLogs(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    if (logs.length > 0) {
      try {
        localStorage.setItem('otomasyon_logs', JSON.stringify(logs.slice(-500)))
      } catch { /* ignore */ }
    }
  }, [logs])

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      eventSourceRef.current?.close()
    }
  }, [fetchStatus])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  // Queue state machine: when queue changes or localRunning finishes, start next
  useEffect(() => {
    // SSE dropped but server still running — wait for isRunning to become false
    if (disconnectedRun) {
      if (!status.isRunning) {
        setDisconnectedRun(null)
        setQueueIndex((idx) => idx + 1)
      }
      return
    }
    if (queue.length > 0 && queueIndex < queue.length && !localRunning) {
      startSingleRun(queue[queueIndex])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, queueIndex, localRunning, disconnectedRun, status.isRunning])

  function addLog(text: string, typeOverride?: LogLine['type']) {
    setLogs((prev) => [...prev, { text, type: typeOverride || classifyLine(text) }])
  }

  // ── Enable / Disable toggle ──────────────────────────────────────────────
  async function toggleEnabled() {
    setEnablingToggle(true)
    try {
      const next = !status.enabled
      const res = await fetch('/api/otomasyon/durum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) throw new Error()
      success(next ? 'Otomasyon aktifleştirildi' : 'Otomasyon durduruldu')
      await fetchStatus()
    } catch {
      error('İşlem başarısız')
    } finally {
      setEnablingToggle(false)
    }
  }

  // ── Single SSE run ────────────────────────────────────────────────────────
  function startSingleRun(slug: string) {
    if (!status.enabled) {
      error('Otomasyon devre dışı. Önce aktifleştirin.')
      setQueue([])
      setQueueIndex(0)
      return
    }

    setLocalRunning(slug)
    addLog(`$ Otomasyon başlatılıyor: ${slug}...`, 'cmd')

    eventSourceRef.current?.close()
    const es = new EventSource(`/api/otomasyon/calistir?category=${encodeURIComponent(slug)}`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          type: string; message?: string; totalPublished?: number
        }
        if (data.type === 'log' && data.message) {
          addLog(data.message)
        } else if (data.type === 'done') {
          addLog(`$ Tamamlandı! ${data.totalPublished ?? 0} yazı yayınlandı`, 'done')
          setRunStats((prev) => ({ published: (prev?.published ?? 0) + (data.totalPublished ?? 0) }))
          es.close()
          setLocalRunning(null)
          fetchStatus()
          // Advance queue
          setQueueIndex((idx) => idx + 1)
        } else if (data.type === 'error') {
          addLog(`❌ ${data.message || 'Bilinmeyen hata'}`, 'err')
          es.close()
          setLocalRunning(null)
          fetchStatus()
          // Advance queue even on error so remaining categories still run
          setQueueIndex((idx) => idx + 1)
        }
      } catch { /* ignore */ }
    }

    es.onerror = () => {
      addLog(`⚠️ SSE bağlantısı kesildi — ${slug} arka planda devam ediyor, bitmesi bekleniyor...`, 'info')
      es.close()
      setDisconnectedRun(slug)
      setLocalRunning(null)
      fetchStatus()
    }
  }

  // ── Run selected categories sequentially ─────────────────────────────────
  function runSelected() {
    const slugs = selected.filter((s) => s !== 'all')
    if (slugs.length === 0) return
    if (localRunning || status.isRunning) return

    setRunStats(null)
    setLogs([{ text: `$ ${slugs.length} kategori sıraya alındı: ${slugs.join(', ')}`, type: 'cmd' }])
    setQueue(slugs)
    setQueueIndex(0)
  }

  // ── Run all categories ────────────────────────────────────────────────────
  function runAll() {
    if (localRunning || status.isRunning) return

    setRunStats(null)
    setLogs([{ text: `$ Tüm kategoriler sıraya alındı (${ALL_SLUGS.length} kategori)`, type: 'cmd' }])
    setQueue(ALL_SLUGS)
    setQueueIndex(0)
  }

  // ── Run a group of slugs ──────────────────────────────────────────────────
  function runGroup(slugs: string[]) {
    if (localRunning || status.isRunning) return

    setRunStats(null)
    setLogs([{ text: `$ ${slugs.length} kategori sıraya alındı: ${slugs.join(', ')}`, type: 'cmd' }])
    setQueue(slugs)
    setQueueIndex(0)
  }

  function stopRun() {
    eventSourceRef.current?.close()
    setLocalRunning(null)
    setDisconnectedRun(null)
    setQueue([])
    setQueueIndex(0)
    addLog('$ Sıra iptal edildi (sunucu mevcut işlemi tamamlayacak)', 'cmd')
  }

  async function saveSchedule() {
    setScheduleLoading(true)
    try {
      const res = await fetch('/api/superadmin/otomasyon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status.schedule),
      })
      if (!res.ok) throw new Error()
      success('Zamanlama kaydedildi')
    } catch {
      error('Kayıt başarısız')
    } finally {
      setScheduleLoading(false)
    }
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSlug(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  function toggleAll() {
    if (selected.length === ALL_SLUGS.length) {
      setSelected([])
    } else {
      setSelected([...ALL_SLUGS])
    }
  }

  const allChecked = selected.length === ALL_SLUGS.length
  const someChecked = selected.length > 0 && !allChecked
  const isAnyRunning = !!localRunning || status.isRunning || !!disconnectedRun
  const isQueuing = queue.length > 0 && queueIndex < queue.length

  // Progress label while queuing
  const queueProgressLabel =
    isQueuing && localRunning
      ? `📋 ${queueIndex + 1}/${queue.length}: ${localRunning} çalışıyor...`
      : isQueuing && disconnectedRun
      ? `⏳ ${queueIndex + 1}/${queue.length}: ${disconnectedRun} arka planda devam ediyor, bitmesi bekleniyor...`
      : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f7931a]/10 flex items-center justify-center">
            <Zap size={20} className="text-[#f7931a]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Otomasyon</h1>
            <p className="text-xs text-[#606080]">AI ile otomatik haber üretimi</p>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-2">
          <Link
            href="/superadmin/otomasyon/ajanlar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16162a] border border-[#1e1e35] text-xs text-[#606080] hover:text-white hover:border-[#f7931a]/40 transition-colors"
          >
            🤖 Ajanlar
          </Link>
          <Link
            href="/superadmin/otomasyon/pipeline"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16162a] border border-[#1e1e35] text-xs text-[#606080] hover:text-white hover:border-[#f7931a]/40 transition-colors"
          >
            🔗 Pipeline
          </Link>
        </div>

        {/* Global enable/disable */}
        <button
          onClick={toggleEnabled}
          disabled={enablingToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            status.enabled
              ? 'bg-[#00c896]/10 border-[#00c896]/30 text-[#00c896] hover:bg-[#00c896]/20'
              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          } disabled:opacity-50`}
        >
          {enablingToggle ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : status.enabled ? (
            <Power size={15} />
          ) : (
            <PowerOff size={15} />
          )}
          {status.enabled ? 'Otomasyon Açık' : 'Otomasyon Kapalı'}
        </button>
      </div>

      {/* Disabled warning */}
      {!status.enabled && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <PowerOff size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Otomasyon devre dışı</p>
            <p className="text-red-400/70 text-xs mt-1">
              Manuel çalıştırma ve zamanlayıcı durduruldu. Aktifleştirmek için yukarıdaki düğmeye basın.
            </p>
          </div>
        </div>
      )}

      {/* Running indicator (background run) */}
      {status.isRunning && !localRunning && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f7931a]/10 border border-[#f7931a]/30">
          <Activity size={18} className="text-[#f7931a] shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[#f7931a] text-sm font-medium">
              Otomasyon arka planda çalışıyor: <code className="font-mono">{status.runningCategory}</code>
            </p>
            <p className="text-[#f7931a]/70 text-xs mt-1">
              Başlangıç:{' '}
              {status.runStartedAt
                ? formatDistanceToNow(new Date(status.runStartedAt), { addSuffix: true, locale: tr })
                : 'bilinmiyor'}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                await fetch('/api/otomasyon/durum', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ resetRunning: true }),
                })
                await fetchStatus()
                success('Çalışma durumu sıfırlandı')
              } catch {
                error('Sıfırlama başarısız')
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-colors shrink-0"
          >
            <Square size={12} /> Zorla Durdur
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status card */}
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock size={15} className="text-[#f7931a]" /> Sistem Durumu
          </h2>
          {statusLoading ? (
            <div className="flex items-center gap-2 text-[#606080] text-sm">
              <RefreshCw size={14} className="animate-spin" /> Yükleniyor...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1e1e35]">
                <span className="text-xs text-[#606080]">Son Çalışma</span>
                <span className="text-sm text-white">
                  {status.lastRun
                    ? formatDistanceToNow(new Date(status.lastRun), { addSuffix: true, locale: tr })
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1e1e35]">
                <span className="text-xs text-[#606080]">Sonraki Çalışma</span>
                <span className="text-sm text-white">{status.nextRun ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1e1e35]">
                <span className="text-xs text-[#606080]">Otomasyon</span>
                <span className={`flex items-center gap-1.5 text-sm font-medium ${status.enabled ? 'text-[#00c896]' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${status.enabled ? 'bg-[#00c896] animate-pulse' : 'bg-red-400'}`} />
                  {status.enabled ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-[#606080]">Şu an</span>
                <span className={`flex items-center gap-1.5 text-sm font-medium ${isAnyRunning ? 'text-[#f7931a]' : 'text-[#606080]'}`}>
                  {isAnyRunning ? (
                    <><RefreshCw size={12} className="animate-spin" /> Çalışıyor</>
                  ) : (
                    'Bekliyor'
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock size={15} className="text-[#f7931a]" /> Zamanlama
          </h2>
          <div className="space-y-3">
            {([ ['sabah', '🌅 Sabah (Tam)'], ['oglen', '☀️ Öğlen (Kripto)'], ['aksam', '🌙 Akşam (Tam)'] ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-[#606080] mb-1.5">{label}</label>
                <input
                  type="time"
                  className={INPUT}
                  value={status.schedule[key]}
                  onChange={(e) => setStatus((s) => ({ ...s, schedule: { ...s.schedule, [key]: e.target.value } }))}
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveSchedule}
            disabled={scheduleLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {scheduleLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Cost warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
        <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-400/80 space-y-1">
          <p className="font-medium text-yellow-400">Maliyet Bilgisi</p>
          <p>Her çalışmada maksimum <strong>2 yazı/kategori</strong> üretilir. Ücretsiz modeller (Gemini Flash, Llama :free) kullanılıyorsa API maliyeti sıfırdır.</p>
          <p>Ücretli model kullanıyorsanız: ~500-700 kelime makale ≈ 1.500-2.500 token. Günde 3 çalışma × 5 kategori × 2 yazı = maks 30 API çağrısı.</p>
          <p className="text-yellow-400 font-medium">🔒 Otomasyonu durdurmak için yukarıdaki "Otomasyon Açık/Kapalı" düğmesine basın.</p>
        </div>
      </div>

      {/* Manuel Çalıştır */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-5">

        {/* Panel header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={15} className="text-[#f7931a]" /> Manuel Çalıştır
          </h2>
          <div className="flex items-center gap-2">
            {localRunning && (
              <button
                onClick={stopRun}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
              >
                <Square size={12} /> Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>

        {/* Queue progress */}
        {queueProgressLabel && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f7931a]/10 border border-[#f7931a]/20">
            <RefreshCw size={13} className="text-[#f7931a] animate-spin shrink-0" />
            <span className="text-xs text-[#f7931a] font-mono">{queueProgressLabel}</span>
          </div>
        )}

        {/* Global action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleAll}
            disabled={isAnyRunning || !status.enabled}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a14] border border-[#1e1e35] text-sm text-white hover:border-[#2a2a45] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allChecked ? (
              <CheckSquare size={15} className="text-[#f7931a]" />
            ) : someChecked ? (
              <CheckSquare size={15} className="text-[#606080]" />
            ) : (
              <Square size={15} className="text-[#606080]" />
            )}
            Tümünü Seç
            {selected.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#f7931a]/20 text-[#f7931a] text-xs font-mono">
                {selected.length}
              </span>
            )}
          </button>

          <button
            onClick={runSelected}
            disabled={isAnyRunning || !status.enabled || selected.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f7931a] hover:bg-[#f7931a]/90 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnyRunning && selected.length > 0 ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Zap size={13} />
            )}
            Seçilileri Çalıştır
            {selected.length > 0 && !isAnyRunning && (
              <span className="text-xs font-mono opacity-80">({selected.length})</span>
            )}
          </button>

          <button
            onClick={runAll}
            disabled={isAnyRunning || !status.enabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e35] hover:bg-[#2a2a45] border border-[#2a2a45] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnyRunning ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Zap size={13} className="text-[#f7931a]" />
            )}
            ▶ Tümünü Sıraya Al
          </button>
        </div>

        {/* Category groups — table layout */}
        <div className="space-y-6">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.group}>
              {/* Group header */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#1e1e35]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: group.color }}>{group.group}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    getCatPipeline(group.slugs[0]) === 'guide'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-[#f7931a]/10 text-[#f7931a]'
                  }`}>
                    {getCatPipeline(group.slugs[0]) === 'guide' ? '📚 guide' : '📰 news'}
                  </span>
                </div>
                <button
                  onClick={() => runGroup(group.slugs)}
                  disabled={isAnyRunning || !status.enabled}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: `${group.color}40`, color: group.color, backgroundColor: `${group.color}10` }}
                >
                  <Zap size={11} />
                  ▶ Grubu Çalıştır
                </button>
              </div>

              {/* Category table */}
              <div className="rounded-xl border border-[#1e1e35] overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {group.slugs.map((slug, idx) => {
                      const isChecked = selected.includes(slug)
                      const isRunningThis = localRunning === slug
                      const catName = getCatName(slug)
                      const catTime = getCatTime(slug)
                      const isLast = idx === group.slugs.length - 1

                      return (
                        <tr
                          key={slug}
                          className={`${!isLast ? 'border-b border-[#1e1e35]' : ''} ${
                            isRunningThis ? 'bg-[#f7931a]/8' : isChecked ? 'bg-[#f7931a]/5' : 'bg-[#0a0a14]'
                          } transition-colors`}
                        >
                          {/* Checkbox + name */}
                          <td className="px-3 py-2.5 w-full">
                            <label className={`flex items-center gap-2.5 cursor-pointer ${
                              isAnyRunning || !status.enabled ? 'opacity-40 cursor-not-allowed' : ''
                            }`}>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isChecked}
                                disabled={isAnyRunning || !status.enabled}
                                onChange={() => toggleSlug(slug)}
                              />
                              {isRunningThis ? (
                                <RefreshCw size={12} className="shrink-0 animate-spin" style={{ color: group.color }} />
                              ) : isChecked ? (
                                <CheckSquare size={13} className="shrink-0 text-[#f7931a]" />
                              ) : (
                                <Square size={13} className="shrink-0 text-[#404060]" />
                              )}
                              <span className="text-white font-medium truncate">{catName}</span>
                              {isRunningThis && (
                                <span className="text-[10px] font-mono animate-pulse" style={{ color: group.color }}>
                                  ● çalışıyor
                                </span>
                              )}
                            </label>
                          </td>
                          {/* Schedule time */}
                          <td className="px-3 py-2.5 whitespace-nowrap text-[#606080]">
                            {catTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {catTime}
                              </span>
                            )}
                          </td>
                          {/* Run button */}
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => startSingleRun(slug)}
                              disabled={isAnyRunning || !status.enabled}
                              className="flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                              style={{ borderColor: `${group.color}40`, color: group.color, backgroundColor: `${group.color}08` }}
                              title={`${catName} çalıştır`}
                            >
                              {isRunningThis ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : (
                                '▶'
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {!status.enabled && (
          <p className="text-xs text-red-400 text-center">Çalıştırmak için otomasyonu aktifleştirin</p>
        )}

        {runStats && !isAnyRunning && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00c896]/10 border border-[#00c896]/20">
            <CheckCircle size={16} className="text-[#00c896]" />
            <span className="text-sm text-[#00c896] font-medium">
              Son çalışma: {runStats.published} yazı yayınlandı
            </span>
          </div>
        )}
      </div>

      {/* Terminal */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${localRunning ? 'bg-[#f7931a] animate-pulse' : 'bg-[#606080]'}`} />
            Terminal
            {localRunning && (
              <span className="text-xs text-[#f7931a] font-mono animate-pulse">● canlı</span>
            )}
          </h2>
          {logs.length > 0 && !localRunning && (
            <button
              onClick={() => { setLogs([]); setRunStats(null); localStorage.removeItem('otomasyon_logs') }}
              className="text-xs text-[#606080] hover:text-white transition-colors"
            >
              Temizle
            </button>
          )}
        </div>

        <div
          ref={terminalRef}
          className="bg-[#050510] border border-[#1e1e35] rounded-xl p-4 font-mono text-xs min-h-[200px] max-h-[400px] overflow-y-auto"
        >
          {logs.length === 0 ? (
            <p className="text-[#606080]">$ Henüz çalıştırma yok — kategori seçip "Seçilileri Çalıştır"a basın...</p>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === 'ok' || line.type === 'done' ? 'text-[#00c896]'
                  : line.type === 'err' ? 'text-red-400'
                  : line.type === 'cmd' ? 'text-[#f7931a]'
                  : 'text-[#c0c0d0]'
                }
              >
                {line.text}
              </div>
            ))
          )}
          {localRunning && <div className="text-[#f7931a] animate-pulse mt-1">▋</div>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#606080]">{logs.length} satır</span>
          <a href="/superadmin/otomasyon/loglar" className="text-xs text-[#f7931a] hover:underline">
            Tüm logları görüntüle →
          </a>
        </div>
      </div>

      {/* Scheduler info */}
      <div className="bg-[#16162a] border border-[#1e1e35] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={15} className="text-[#606080]" /> Zamanlayıcı (Arka Plan)
        </h2>
        <div className="space-y-2 text-xs text-[#606080]">
          <p>
            Zamanlayıcıyı ayrı bir terminalde çalıştırın (Next.js çalışırken):
          </p>
          <div className="bg-[#050510] rounded-lg p-3 font-mono text-[#00c896] border border-[#1e1e35]">
            npx tsx automation/utils/scheduler.ts
          </div>
          <p className="text-yellow-400/80">
            ⚠️ Zamanlayıcı çalışırken <strong>otomasyon devre dışı</strong> bırakırsanız, yeni çalışmalar başlamaz.
            Mevcut çalışma tamamlanır ama yeni tetikleme olmaz.
          </p>
          <p>Windows'ta arka planda çalıştırmak için:</p>
          <div className="bg-[#050510] rounded-lg p-3 font-mono text-[#00c896] border border-[#1e1e35]">
            pm2 start automation/utils/scheduler.ts --interpreter tsx
          </div>
        </div>
      </div>
    </div>
  )
}
