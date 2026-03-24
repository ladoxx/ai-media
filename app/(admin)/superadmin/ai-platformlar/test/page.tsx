'use client'

import { useState, useEffect } from 'react'
import { getPlatformMeta } from '@/lib/ai-models'
import { useToast } from '@/components/ui/Toast'

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

type PlatformTestStatus = 'idle' | 'running' | 'success' | 'error'

interface PlatformTestEntry {
  platformId: string
  platformName: string
  platformSlug: string
  status: PlatformTestStatus
  duration?: number
  error?: string
}

export default function AiTestKonsoluPage() {
  const toast = useToast()

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loadingPlatforms, setLoadingPlatforms] = useState(true)

  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Test all
  const [testAllResults, setTestAllResults] = useState<PlatformTestEntry[]>([])
  const [testingAll, setTestingAll] = useState(false)

  useEffect(() => {
    fetchPlatforms()
  }, [])

  async function fetchPlatforms() {
    try {
      setLoadingPlatforms(true)
      const res = await fetch('/api/superadmin/ai-platformlar')
      if (!res.ok) throw new Error()
      const data: Platform[] = await res.json()
      setPlatforms(data)
      if (data.length > 0) {
        const primary = data.find((p) => p.isPrimary && p.active) ?? data.find((p) => p.active)
        if (primary) setSelectedPlatformId(primary.id)
      }
    } catch {
      toast.error('Platformlar yüklenemedi')
    } finally {
      setLoadingPlatforms(false)
    }
  }

  async function handleTest() {
    if (!selectedPlatformId) {
      toast.error('Platform seçin')
      return
    }
    if (!prompt.trim()) {
      toast.error('Prompt boş olamaz')
      return
    }
    try {
      setLoading(true)
      setResult(null)
      const res = await fetch('/api/superadmin/ai-platformlar/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: selectedPlatformId, prompt }),
      })
      const data: TestResult = await res.json()
      setResult(data)
      if (data.success) {
        toast.success('Test başarılı')
      } else {
        toast.error('Test başarısız')
      }
    } catch {
      setResult({ success: false, error: 'Bağlantı hatası' })
      toast.error('Test hatası')
    } finally {
      setLoading(false)
    }
  }

  async function handleTestAll() {
    const active = platforms.filter((p) => p.active)
    if (active.length === 0) {
      toast.error('Aktif platform yok')
      return
    }
    const testPrompt = prompt.trim() || 'Bitcoin hakkında 3 cümle Türkçe yaz'
    setTestingAll(true)

    const initial: PlatformTestEntry[] = active.map((p) => ({
      platformId: p.id,
      platformName: p.name,
      platformSlug: p.slug,
      status: 'idle',
    }))
    setTestAllResults(initial)

    for (const platform of active) {
      setTestAllResults((prev) =>
        prev.map((e) => (e.platformId === platform.id ? { ...e, status: 'running' } : e))
      )
      try {
        const res = await fetch('/api/superadmin/ai-platformlar/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platformId: platform.id, prompt: testPrompt }),
        })
        const data: TestResult = await res.json()
        setTestAllResults((prev) =>
          prev.map((e) =>
            e.platformId === platform.id
              ? {
                  ...e,
                  status: data.success ? 'success' : 'error',
                  duration: data.duration,
                  error: data.error,
                }
              : e
          )
        )
      } catch {
        setTestAllResults((prev) =>
          prev.map((e) =>
            e.platformId === platform.id
              ? { ...e, status: 'error', error: 'Bağlantı hatası' }
              : e
          )
        )
      }
    }
    setTestingAll(false)
    toast.success('Tüm testler tamamlandı')
  }

  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Test Konsolu</h1>
        <p className="text-[#606080] mt-1">Platform ve model seçerek AI bağlantısını test edin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Platform select */}
          <div>
            <label className="block text-sm text-[#606080] mb-1.5">Platform</label>
            {loadingPlatforms ? (
              <div className="h-10 bg-[#16162a] border border-[#1e1e35] rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedPlatformId}
                onChange={(e) => setSelectedPlatformId(e.target.value)}
                className="w-full bg-[#16162a] border border-[#1e1e35] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#f7931a]/50 outline-none"
              >
                <option value="">— Platform seçin —</option>
                {platforms.map((p) => {
                  const meta = getPlatformMeta(p.slug)
                  return (
                    <option key={p.id} value={p.id}>
                      {meta?.icon} {p.name} ({p.slug}) {p.isPrimary ? '⭐' : ''} {!p.active ? '[PASİF]' : ''}
                    </option>
                  )
                })}
              </select>
            )}
            {selectedPlatform && (
              <p className="text-xs text-[#606080] mt-1.5">
                Model: <span className="text-white">{selectedPlatform.model}</span>
                {selectedPlatform.isPrimary && (
                  <span className="ml-2 text-[#f7931a]">⭐ Birincil</span>
                )}
                {selectedPlatform.isBackup && (
                  <span className="ml-2 text-blue-400">🔄 Yedek</span>
                )}
              </p>
            )}
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm text-[#606080] mb-1.5">Prompt</label>
            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Bitcoin hakkında 3 cümle Türkçe yaz"
              className="w-full bg-[#16162a] border border-[#1e1e35] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#f7931a]/50 outline-none resize-none"
            />
          </div>

          {/* Test button */}
          <button
            onClick={handleTest}
            disabled={loading || !selectedPlatformId}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#f7931a] text-white text-sm font-medium rounded-lg hover:bg-[#f7931a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Test ediliyor...
              </>
            ) : (
              <>▶ Test Et</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div
              className={`rounded-xl p-4 border text-sm ${
                result.success
                  ? 'bg-[#00c896]/5 border-[#00c896]/30'
                  : 'bg-red-500/5 border-red-500/30'
              }`}
            >
              {result.success ? (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-semibold text-[#00c896]">✅ Başarılı ({result.duration}ms)</span>
                    <span className="text-[#606080]">Token: {result.tokens?.toLocaleString('tr-TR')}</span>
                    {selectedPlatform && (
                      <span className="text-[#606080]">
                        Platform: {selectedPlatform.name}
                      </span>
                    )}
                  </div>
                  <hr className="border-[#1e1e35] mb-3" />
                  <p className="text-white whitespace-pre-wrap leading-relaxed">{result.content}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-400 mb-1">❌ Hata</p>
                  <p className="text-red-300">{result.error}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: 1/3 */}
        <div className="lg:col-span-1">
          <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 sticky top-6">
            <h2 className="text-white font-bold mb-1">Tüm Platformları Test Et</h2>
            <p className="text-[#606080] text-xs mb-4">
              Aktif tüm platformları sırayla test eder. Yukarıdaki prompt kullanılır.
            </p>

            <button
              onClick={handleTestAll}
              disabled={testingAll || loadingPlatforms}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#1e1e35] text-white text-sm rounded-lg hover:bg-[#1e1e35] disabled:opacity-50 transition-colors mb-4"
            >
              {testingAll ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Test ediliyor...
                </>
              ) : (
                <>🔄 Hepsini Test Et</>
              )}
            </button>

            {/* Results list */}
            {testAllResults.length > 0 && (
              <div className="space-y-2">
                {testAllResults.map((entry) => {
                  const meta = getPlatformMeta(entry.platformSlug)
                  return (
                    <div
                      key={entry.platformId}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a14]"
                    >
                      <span className="text-base shrink-0">{meta?.icon ?? '🤖'}</span>
                      <span className="text-white text-sm flex-1 truncate">{entry.platformName}</span>
                      <span className="text-xs shrink-0">
                        {entry.status === 'idle' && (
                          <span className="text-[#606080]">● Bekliyor</span>
                        )}
                        {entry.status === 'running' && (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <span className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            Test ediliyor...
                          </span>
                        )}
                        {entry.status === 'success' && (
                          <span className="text-[#00c896]">✅ {entry.duration}ms</span>
                        )}
                        {entry.status === 'error' && (
                          <span className="text-red-400" title={entry.error}>❌ Hata</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {testAllResults.length === 0 && !testingAll && (
              <p className="text-[#606080] text-xs text-center py-4">
                Test sonuçları burada görünecek
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
