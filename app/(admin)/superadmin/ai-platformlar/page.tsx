'use client'

import { useState, useEffect, useRef } from 'react'
import { PLATFORM_META, AI_MODELS, getPlatformMeta } from '@/lib/ai-models'
import { useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const PLATFORM_ORDER = ['gemini', 'openrouter', 'deepseek', 'groq', 'huggingface', 'anthropic', 'openai']

interface Platform {
  id: string
  name: string
  slug: string
  apiKey: string
  model: string
  baseUrl: string | null
  active: boolean
  isPrimary: boolean
  isBackup: boolean
  monthlyLimit: number | null
  usedTokens: number
  lastTested: string | null
  testStatus: string | null
  createdAt: string
  updatedAt: string
}

interface TestResult {
  success: boolean
  content?: string
  tokens?: number
  duration?: number
  error?: string
}

interface FormData {
  slug: string
  apiKey: string
  model: string
  baseUrl: string
  monthlyLimit: string
  active: boolean
}

export default function AiPlatformlarPage() {
  const toast = useToast()
  const primarySectionRef = useRef<HTMLDivElement>(null)

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string>('gemini')
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    slug: 'gemini',
    apiKey: '',
    model: '',
    baseUrl: '',
    monthlyLimit: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Platform | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Primary/backup selection
  const [primaryId, setPrimaryId] = useState<string>('')
  const [backupId, setBackupId] = useState<string>('')
  const [savingPrimary, setSavingPrimary] = useState(false)
  const [savingBackup, setSavingBackup] = useState(false)

  useEffect(() => {
    fetchPlatforms()
  }, [])

  async function fetchPlatforms() {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/ai-platformlar')
      if (!res.ok) throw new Error('Veri alınamadı')
      const data: Platform[] = await res.json()
      setPlatforms(data)
      const primary = data.find((p) => p.isPrimary)
      const backup = data.find((p) => p.isBackup)
      if (primary) setPrimaryId(primary.id)
      if (backup) setBackupId(backup.id)
    } catch (e) {
      toast.error('Platformlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal(slug: string) {
    const meta = getPlatformMeta(slug)
    setEditPlatform(null)
    setSelectedSlug(slug)
    setShowApiKey(false)
    setFormData({
      slug,
      apiKey: '',
      model: meta?.defaultModel ?? '',
      baseUrl: meta?.defaultBaseUrl ?? '',
      monthlyLimit: '',
      active: true,
    })
    setShowModal(true)
  }

  function openEditModal(platform: Platform) {
    setEditPlatform(platform)
    setSelectedSlug(platform.slug)
    setShowApiKey(false)
    setFormData({
      slug: platform.slug,
      apiKey: '',
      model: platform.model,
      baseUrl: platform.baseUrl ?? '',
      monthlyLimit: platform.monthlyLimit ? String(platform.monthlyLimit) : '',
      active: platform.active,
    })
    setShowModal(true)
  }

  function handleSlugChange(slug: string) {
    const meta = getPlatformMeta(slug)
    setSelectedSlug(slug)
    setFormData((prev) => ({
      ...prev,
      slug,
      model: meta?.defaultModel ?? '',
      baseUrl: meta?.defaultBaseUrl ?? '',
    }))
  }

  async function handleSave() {
    if (!formData.apiKey && !editPlatform) {
      toast.error('API Key zorunludur')
      return
    }
    try {
      setSaving(true)
      const body: Record<string, unknown> = {
        slug: formData.slug,
        model: formData.model,
        baseUrl: formData.baseUrl || null,
        monthlyLimit: formData.monthlyLimit ? Number(formData.monthlyLimit) : null,
        active: formData.active,
      }
      if (formData.apiKey) body.apiKey = formData.apiKey
      if (editPlatform) body.id = editPlatform.id

      const res = await fetch('/api/superadmin/ai-platformlar', {
        method: editPlatform ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Hata')
      }
      toast.success(editPlatform ? 'Platform güncellendi' : 'Platform eklendi')
      setShowModal(false)
      fetchPlatforms()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const res = await fetch('/api/superadmin/ai-platformlar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (!res.ok) throw new Error('Silinemedi')
      toast.success('Platform silindi')
      setDeleteTarget(null)
      fetchPlatforms()
    } catch {
      toast.error('Silme hatası')
    } finally {
      setDeleting(false)
    }
  }

  async function handleTest(platformId: string) {
    setTesting((prev) => ({ ...prev, [platformId]: true }))
    setTestResults((prev) => {
      const next = { ...prev }
      delete next[platformId]
      return next
    })
    try {
      const res = await fetch('/api/superadmin/ai-platformlar/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId }),
      })
      const data = await res.json()
      setTestResults((prev) => ({ ...prev, [platformId]: data }))
      if (data.success) {
        toast.success('Test başarılı')
        fetchPlatforms()
      } else {
        toast.error('Test başarısız: ' + data.error)
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [platformId]: { success: false, error: 'Bağlantı hatası' } }))
      toast.error('Test hatası')
    } finally {
      setTesting((prev) => ({ ...prev, [platformId]: false }))
    }
  }

  async function handleToggleActive(platform: Platform) {
    try {
      const res = await fetch('/api/superadmin/ai-platformlar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: platform.id, active: !platform.active }),
      })
      if (!res.ok) throw new Error()
      fetchPlatforms()
    } catch {
      toast.error('Durum güncellenemedi')
    }
  }

  async function handleSetPrimary(platformId: string) {
    try {
      const res = await fetch('/api/superadmin/ai-platformlar/birincil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId: platformId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Birincil platform güncellendi')
      fetchPlatforms()
    } catch {
      toast.error('Birincil platform ayarlanamadı')
    }
  }

  async function handleSetBackup(platformId: string) {
    try {
      const res = await fetch('/api/superadmin/ai-platformlar/birincil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: platformId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Yedek platform güncellendi')
      fetchPlatforms()
    } catch {
      toast.error('Yedek platform ayarlanamadı')
    }
  }

  async function savePrimary() {
    try {
      setSavingPrimary(true)
      const res = await fetch('/api/superadmin/ai-platformlar/birincil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Birincil platform kaydedildi')
      fetchPlatforms()
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setSavingPrimary(false)
    }
  }

  async function saveBackup() {
    try {
      setSavingBackup(true)
      const res = await fetch('/api/superadmin/ai-platformlar/birincil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Yedek platform kaydedildi')
      fetchPlatforms()
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setSavingBackup(false)
    }
  }

  const activePrimary = platforms.find((p) => p.isPrimary && p.active)
  const activePlatforms = platforms.filter((p) => p.active)
  const platformBySlug = (slug: string) => platforms.find((p) => p.slug === slug)

  const currentMeta = getPlatformMeta(selectedSlug)
  const currentModels = AI_MODELS[selectedSlug] ?? []
  const showBaseUrl = selectedSlug === 'openrouter' || selectedSlug === 'openai'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#f7931a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Platformlar</h1>
        <p className="text-[#606080] mt-1">API anahtarlarını ve platform ayarlarını yönetin</p>
      </div>

      {/* Active primary banner */}
      {activePrimary && (() => {
        const meta = getPlatformMeta(activePrimary.slug)
        return (
          <div className="bg-[#f7931a]/10 border border-[#f7931a]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta?.icon}</span>
                <div>
                  <span className="text-white font-semibold">Aktif AI: {activePrimary.name}</span>
                  <span className="ml-2 text-[#606080] text-sm">{activePrimary.model}</span>
                </div>
              </div>
              <button
                onClick={() => primarySectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm px-3 py-1.5 border border-[#f7931a]/50 text-[#f7931a] rounded-lg hover:bg-[#f7931a]/10 transition-colors"
              >
                Platformu Değiştir
              </button>
            </div>
          </div>
        )
      })()}

      {/* Platform cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {PLATFORM_ORDER.map((slug) => {
          const meta = getPlatformMeta(slug)
          const platform = platformBySlug(slug)
          if (!meta) return null

          if (!platform) {
            // Empty / add card
            return (
              <div
                key={slug}
                className="bg-[#16162a] border border-dashed border-[#1e1e35] rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]"
              >
                <span className="text-4xl">{meta.icon}</span>
                <div>
                  <p className="text-white font-semibold">{meta.name}</p>
                  <p className="text-[#606080] text-xs mt-1">{meta.pricing}</p>
                  <a
                    href={`https://${meta.howToGet.split(' → ')[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#f7931a] hover:underline mt-1 block"
                  >
                    {meta.howToGet}
                  </a>
                </div>
                <button
                  onClick={() => openAddModal(slug)}
                  className="mt-2 px-4 py-2 bg-[#f7931a] text-white text-sm rounded-lg hover:bg-[#f7931a]/90 transition-colors font-medium"
                >
                  + Platform Ekle
                </button>
              </div>
            )
          }

          // Existing platform card
          const testResult = testResults[platform.id]
          const isTesting = testing[platform.id]

          let statusBadge: React.ReactNode
          if (platform.isPrimary) {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#f7931a]/20 text-[#f7931a] border border-[#f7931a]/30">
                BİRİNCİL ⭐
              </span>
            )
          } else if (platform.isBackup) {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                YEDEK 🔄
              </span>
            )
          } else if (platform.active) {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                AKTİF
              </span>
            )
          } else {
            statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#606080]/20 text-[#606080] border border-[#606080]/30">
                PASİF
              </span>
            )
          }

          const usagePercent = platform.monthlyLimit
            ? Math.min(100, Math.round((platform.usedTokens / platform.monthlyLimit) * 100))
            : null

          return (
            <div
              key={slug}
              className="bg-[#16162a] border border-[#1e1e35] rounded-xl overflow-hidden flex flex-col"
              style={{ borderLeftColor: meta.color, borderLeftWidth: 4 }}
            >
              {/* Card header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-[#1e1e35]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.icon}</span>
                  <span className="text-white font-semibold text-sm">{meta.name}</span>
                </div>
                {statusBadge}
              </div>

              {/* Card body */}
              <div className="px-4 py-3 flex-1 space-y-2 text-sm">
                {/* API Key */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606080]">API Key:</span>
                  <span className="text-white font-mono text-xs">{platform.apiKey}</span>
                </div>

                {/* Model */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606080]">Model:</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-mono"
                    style={{ backgroundColor: meta.color + '20', color: meta.color }}
                  >
                    {platform.model}
                  </span>
                </div>

                {/* Base URL */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606080]">Base URL:</span>
                  <span className="text-white text-xs truncate max-w-[160px]">
                    {platform.baseUrl ? platform.baseUrl : '(varsayılan)'}
                  </span>
                </div>

                {/* Token usage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#606080]">Bu ay:</span>
                    <span className="text-white">{platform.usedTokens.toLocaleString('tr-TR')} token</span>
                  </div>
                  {usagePercent !== null && (
                    <div className="w-full bg-[#1e1e35] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${usagePercent}%`,
                          backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f7931a' : '#00c896',
                        }}
                      />
                    </div>
                  )}
                  {platform.monthlyLimit && (
                    <p className="text-[#606080] text-xs mt-0.5">
                      Limit: {platform.monthlyLimit.toLocaleString('tr-TR')} ({usagePercent}%)
                    </p>
                  )}
                </div>

                {/* Last test */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606080]">Son test:</span>
                  {platform.lastTested ? (
                    <span className={`text-xs ${platform.testStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {platform.testStatus === 'success' ? '✅' : '❌'}{' '}
                      {formatDistanceToNow(new Date(platform.lastTested), { addSuffix: true, locale: tr })}
                    </span>
                  ) : (
                    <span className="text-[#606080] text-xs">Henüz test edilmedi</span>
                  )}
                </div>

                {/* Pricing */}
                <p className="text-[#606080] text-xs">{meta.pricing}</p>
              </div>

              {/* Footer actions */}
              <div className="px-4 py-3 border-t border-[#1e1e35] space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Test */}
                  <button
                    onClick={() => handleTest(platform.id)}
                    disabled={isTesting}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-[#1e1e35] text-white hover:bg-[#1e1e35] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isTesting ? (
                      <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Test ediliyor...</>
                    ) : (
                      <>🔌 Test Et</>
                    )}
                  </button>

                  {/* Primary */}
                  <button
                    onClick={() => !platform.isPrimary && handleSetPrimary(platform.id)}
                    disabled={platform.isPrimary}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      platform.isPrimary
                        ? 'border-[#f7931a]/50 text-[#f7931a] opacity-75 cursor-default'
                        : 'border-[#1e1e35] text-[#606080] hover:text-[#f7931a] hover:border-[#f7931a]/30'
                    }`}
                  >
                    {platform.isPrimary ? '⭐ Birincil ✓' : '⭐ Birincil'}
                  </button>

                  {/* Backup */}
                  <button
                    onClick={() => !platform.isBackup && handleSetBackup(platform.id)}
                    disabled={platform.isBackup}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                      platform.isBackup
                        ? 'border-blue-500/50 text-blue-400 opacity-75 cursor-default'
                        : 'border-[#1e1e35] text-[#606080] hover:text-blue-400 hover:border-blue-500/30'
                    }`}
                  >
                    {platform.isBackup ? '🔄 Yedek ✓' : '🔄 Yedek'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(platform)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-[#1e1e35] text-[#606080] hover:text-white hover:bg-[#1e1e35] transition-colors"
                  >
                    ✏️ Düzenle
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(platform)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    🗑️ Sil
                  </button>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(platform)}
                    className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      platform.active ? 'bg-[#00c896]' : 'bg-[#1e1e35]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        platform.active ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Test result */}
                {testResult && (
                  <div
                    className={`rounded-lg p-3 text-xs ${
                      testResult.success
                        ? 'bg-green-500/5 border border-green-500/20 text-green-400'
                        : 'bg-red-500/5 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {testResult.success ? (
                      <>
                        <p className="font-medium">
                          ✅ Başarılı ({testResult.duration}ms) — {testResult.tokens} token
                        </p>
                        <p className="mt-1 text-[#606080] break-all">{testResult.content?.slice(0, 100)}</p>
                      </>
                    ) : (
                      <p>❌ Hata: {testResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Primary/backup selection section */}
      <div ref={primarySectionRef} className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Birincil Platform Seçimi</h2>
        <p className="text-[#606080] text-sm mb-6">Otomasyon için hangi platform kullanılsın?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>⭐</span> Birincil Platform
            </h3>
            <div className="space-y-2 mb-4">
              {activePlatforms.map((p) => {
                const meta = getPlatformMeta(p.slug)
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-[#1e1e35] transition-colors"
                  >
                    <input
                      type="radio"
                      name="primary"
                      value={p.id}
                      checked={primaryId === p.id}
                      onChange={() => setPrimaryId(p.id)}
                      className="accent-[#f7931a]"
                    />
                    <span className="text-lg">{meta?.icon}</span>
                    <span className="text-white text-sm">{p.name}</span>
                    <span className="text-[#606080] text-xs ml-auto">{p.model}</span>
                  </label>
                )
              })}
              {activePlatforms.length === 0 && (
                <p className="text-[#606080] text-sm">Aktif platform yok</p>
              )}
            </div>
            <button
              onClick={savePrimary}
              disabled={savingPrimary || !primaryId}
              className="px-4 py-2 bg-[#f7931a] text-white text-sm rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors font-medium"
            >
              {savingPrimary ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>

          {/* Backup */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>🔄</span> Yedek Platform
            </h3>
            <div className="space-y-2 mb-4">
              {activePlatforms
                .filter((p) => p.id !== primaryId)
                .map((p) => {
                  const meta = getPlatformMeta(p.slug)
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-[#1e1e35] transition-colors"
                    >
                      <input
                        type="radio"
                        name="backup"
                        value={p.id}
                        checked={backupId === p.id}
                        onChange={() => setBackupId(p.id)}
                        className="accent-blue-500"
                      />
                      <span className="text-lg">{meta?.icon}</span>
                      <span className="text-white text-sm">{p.name}</span>
                      <span className="text-[#606080] text-xs ml-auto">{p.model}</span>
                    </label>
                  )
                })}
              {activePlatforms.filter((p) => p.id !== primaryId).length === 0 && (
                <p className="text-[#606080] text-sm">Başka aktif platform yok</p>
              )}
            </div>
            <button
              onClick={saveBackup}
              disabled={savingBackup || !backupId}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {savingBackup ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editPlatform ? `Platform Düzenle: ${editPlatform.name}` : 'Platform Ekle'}
        size="md"
      >
        <div className="space-y-4">
          {/* Platform select (add mode only) */}
          {!editPlatform && (
            <div>
              <label className="block text-sm text-[#606080] mb-1.5">Platform</label>
              <select
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f7931a]/50 outline-none"
              >
                {PLATFORM_META.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm text-[#606080] mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={editPlatform ? 'Değiştirmek için yeni key girin' : 'API anahtarınızı girin'}
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 pr-10 text-white text-sm focus:border-[#f7931a]/50 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606080] hover:text-white"
              >
                {showApiKey ? '🙈' : '👁'}
              </button>
            </div>
            {currentMeta && (
              <p className="text-xs text-[#606080] mt-1">
                Nasıl alınır:{' '}
                <a
                  href={`https://${currentMeta.howToGet.split(' → ')[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f7931a] hover:underline"
                >
                  {currentMeta.howToGet}
                </a>
              </p>
            )}
          </div>

          {/* Model select + custom input */}
          <div>
            <label className="block text-sm text-[#606080] mb-1.5">
              Varsayılan Model
              {selectedSlug === 'openrouter' && (
                <span className="ml-2 text-xs text-[#f7931a]">
                  — elle model ID girebilirsiniz
                </span>
              )}
            </label>
            {currentModels.length > 0 && (
              <select
                value={currentModels.find((m) => m.id === formData.model) ? formData.model : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setFormData((prev) => ({ ...prev, model: e.target.value }))
                  }
                }}
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f7931a]/50 outline-none mb-2"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.free ? '🆓 ' : '💰 '}{m.name}{m.speed ? ` · ${m.speed}` : ''}{m.contextWindow ? ` · ${m.contextWindow}` : ''}
                  </option>
                ))}
                <option value="__custom__">✏️ Özel model ID gir...</option>
              </select>
            )}
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
              placeholder={
                selectedSlug === 'openrouter'
                  ? 'Örn: google/gemini-2.0-flash-exp:free'
                  : 'Model ID girin'
              }
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f7931a]/50 outline-none font-mono"
            />
            {selectedSlug === 'openrouter' && (
              <p className="text-xs text-[#606080] mt-1">
                Tüm ücretsiz modeller:{' '}
                <a
                  href="https://openrouter.ai/models?q=:free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f7931a] hover:underline"
                >
                  openrouter.ai/models?q=:free →
                </a>
              </p>
            )}
          </div>

          {/* Base URL (openrouter / openai only) */}
          {showBaseUrl && (
            <div>
              <label className="block text-sm text-[#606080] mb-1.5">
                Custom Base URL <span className="text-xs">(opsiyonel)</span>
              </label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder={currentMeta?.defaultBaseUrl ?? 'https://...'}
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f7931a]/50 outline-none"
              />
            </div>
          )}

          {/* Monthly limit */}
          <div>
            <label className="block text-sm text-[#606080] mb-1.5">Aylık Token Limiti</label>
            <input
              type="number"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData((prev) => ({ ...prev, monthlyLimit: e.target.value }))}
              placeholder="Sınırsız"
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-lg px-3 py-2 text-white text-sm focus:border-[#f7931a]/50 outline-none"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <label className="text-sm text-[#606080]">Aktif</label>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, active: !prev.active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.active ? 'bg-[#00c896]' : 'bg-[#1e1e35]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2 border border-[#1e1e35] text-[#606080] hover:text-white rounded-lg text-sm transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-[#f7931a] text-white rounded-lg text-sm font-medium hover:bg-[#f7931a]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Platformu Sil"
        message={`"${deleteTarget?.name}" platformunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        danger
        loading={deleting}
      />
    </div>
  )
}
