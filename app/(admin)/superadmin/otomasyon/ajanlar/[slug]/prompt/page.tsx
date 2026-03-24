'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { PROMPT_VARIABLES } from '@/lib/prompt-builder'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface AgentPrompt {
  id: string
  name: string
  slug: string
  role: string
  systemPrompt: string | null
  userPromptTmpl: string | null
  promptVersion: number
  updatedAt: string
}

interface HistoryEntry {
  id: string
  version: number
  note: string | null
  createdAt: string
  systemPrompt: string
  userPromptTmpl: string
}

interface TestResult {
  content: string
  tokens: number
  cost: number
  duration: number
}

type TabType = 'system' | 'user' | 'history'

export default function PromptEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [agent, setAgent] = useState<AgentPrompt | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userTemplate, setUserTemplate] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('system')
  const [saveNote, setSaveNote] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testData, setTestData] = useState({
    title: 'Bitcoin 70.000 dolara ulaştı',
    summary: 'BTC, kurumsal alımların etkisiyle yeni rekor kırdı ve 70 bin dolar sınırını geçti.',
    source: 'coindesk.com',
    category: 'kripto',
  })

  const loadAgent = useCallback(async () => {
    const [agentRes, historyRes] = await Promise.all([
      fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt`),
      fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt/history`),
    ])
    if (agentRes.ok) {
      const data = await agentRes.json() as AgentPrompt
      setAgent(data)
      setSystemPrompt(data.systemPrompt || '')
      setUserTemplate(data.userPromptTmpl || '')
    }
    if (historyRes.ok) setHistory(await historyRes.json())
  }, [slug])

  useEffect(() => { loadAgent() }, [loadAgent])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPromptTmpl: userTemplate, note: saveNote }),
      })
      if (res.ok) {
        setShowSaveModal(false)
        setSaveNote('')
        await loadAgent()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPromptTmpl: userTemplate,
          testData,
        }),
      })
      const data = await res.json() as TestResult & { error?: string }
      if (res.ok) setTestResult(data)
      else setTestError(data.error || 'Hata oluştu')
    } finally {
      setTesting(false)
    }
  }

  async function handleRestore(historyId: string) {
    const res = await fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId }),
    })
    if (res.ok) await loadAgent()
  }

  async function handleReset() {
    setShowResetConfirm(false)
    const res = await fetch(`/api/superadmin/otomasyon/ajanlar/${slug}/prompt/reset`, {
      method: 'POST',
    })
    if (res.ok) await loadAgent()
  }

  function insertVariable(key: string) {
    const tag = `{{${key}}}`
    if (activeTab === 'system') setSystemPrompt((p) => p + tag)
    else if (activeTab === 'user') setUserTemplate((p) => p + tag)
  }

  if (!agent) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  const isCodeAgent = agent.role === 'media' || agent.role === 'publisher'
  if (isCodeAgent) {
    return (
      <div className="p-8 text-center">
        <p className="text-6xl mb-4">🔧</p>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{agent.name}</h2>
        <p className="text-[var(--text-muted)]">Bu ajan kod tabanlıdır, özel prompt kullanmaz.</p>
        <Link href="/superadmin/otomasyon/ajanlar" className="mt-4 inline-block text-blue-400 hover:underline">← Geri</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/superadmin/otomasyon/ajanlar" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">←</Link>
            <div>
              <h1 className="font-display font-bold text-[var(--text-primary)]">
                {agent.name} — Prompt Editörü
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                v{agent.promptVersion} · Güncellendi: {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true, locale: tr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors"
            >
              ↩️ Varsayılana Dön
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              💾 Kaydet
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {(['system', 'user', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'system' ? '⚙️ System Prompt' : tab === 'user' ? '💬 User Template' : '📋 Geçmiş'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'history' ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            {history.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm">Henüz geçmiş yok.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="pb-2">Ver</th>
                    <th className="pb-2">Not</th>
                    <th className="pb-2">Tarih</th>
                    <th className="pb-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id} className="border-b border-[var(--border)]/50">
                      <td className="py-3 font-mono text-[var(--text-primary)]">v{h.version}</td>
                      <td className="py-3 text-[var(--text-muted)]">{h.note || '—'}</td>
                      <td className="py-3 text-[var(--text-muted)] text-xs">
                        {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true, locale: tr })}
                      </td>
                      <td className="py-3">
                        {i === 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Aktif</span>
                        ) : (
                          <button
                            onClick={() => handleRestore(h.id)}
                            className="text-xs px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Geri Al
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Editor column */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--border)]">
            {/* Variable buttons */}
            <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2 flex-wrap bg-[var(--bg-card)]/50">
              <span className="text-xs text-[var(--text-muted)] mr-1">Değişkenler:</span>
              {PROMPT_VARIABLES.filter(v =>
                activeTab === 'system'
                  ? false
                  : true
              ).map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  title={v.description}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-blue-400 hover:border-blue-500/50 transition-colors font-mono"
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>

            {/* Monaco editor */}
            <div className="flex-1 min-h-[400px]">
              <MonacoEditor
                height="100%"
                defaultLanguage="markdown"
                theme="vs-dark"
                value={activeTab === 'system' ? systemPrompt : userTemplate}
                onChange={(val) => {
                  if (activeTab === 'system') setSystemPrompt(val || '')
                  else setUserTemplate(val || '')
                }}
                options={{
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              />
            </div>

            {/* Footer stats */}
            <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)] bg-[var(--bg-card)]/50">
              Karakter: {(activeTab === 'system' ? systemPrompt : userTemplate).length.toLocaleString()}
            </div>
          </div>

          {/* Test panel */}
          <div className="w-[380px] flex-shrink-0 flex flex-col bg-[var(--bg-primary)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">🧪 Test Paneli</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Başlık</label>
                <input
                  value={testData.title}
                  onChange={(e) => setTestData((d) => ({ ...d, title: e.target.value }))}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Özet</label>
                <textarea
                  value={testData.summary}
                  onChange={(e) => setTestData((d) => ({ ...d, summary: e.target.value }))}
                  rows={3}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Kaynak</label>
                  <input
                    value={testData.source}
                    onChange={(e) => setTestData((d) => ({ ...d, source: e.target.value }))}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Kategori</label>
                  <input
                    value={testData.category}
                    onChange={(e) => setTestData((d) => ({ ...d, category: e.target.value }))}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <button
                onClick={handleTest}
                disabled={testing}
                className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {testing ? (
                  <><span className="animate-spin">⚙️</span> Test ediliyor...</>
                ) : (
                  '▶ Test Et'
                )}
              </button>

              {testError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  ❌ {testError}
                </div>
              )}

              {testResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                    <span>🔤 {testResult.tokens} token</span>
                    <span>💰 ${testResult.cost.toFixed(5)}</span>
                    <span>⏱ {(testResult.duration / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text-primary)] font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed">
                    {testResult.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">💾 Prompt Kaydet</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">v{(agent.promptVersion || 0) + 1} olarak kaydedilecek</p>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Bu değişiklik için not (isteğe bağlı):</label>
            <input
              value={saveNote}
              onChange={(e) => setSaveNote(e.target.value)}
              placeholder="Bloomberg tarzı eklendi..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-blue-500/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving ? '...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">↩️ Varsayılana Dön</h2>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Mevcut prompt yedeklenecek ve fabrika ayarlarına dönülecek. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
              >
                Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
