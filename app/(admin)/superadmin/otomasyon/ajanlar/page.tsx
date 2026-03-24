'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Agent {
  id: string
  name: string
  slug: string
  role: string
  description: string
  active: boolean
  isCritical: boolean
  platformSlug: string
  model: string
  promptVersion: number
  lastRun: string | null
  lastStatus: string | null
  runCount: number
  totalTokens: number
  totalCost: number
}

const ROLE_ICONS: Record<string, string> = {
  scout: '🕵️',
  writer: '✍️',
  editor: '🧠',
  seo: '💰',
  media: '🖼️',
  publisher: '🚀',
}

const ROLE_LABELS: Record<string, string> = {
  scout: 'Scout',
  writer: 'Writer',
  editor: 'Editor',
  seo: 'SEO',
  media: 'Media',
  publisher: 'Publisher',
}

export default function AjanlarPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/otomasyon/ajanlar')
      if (res.ok) setAgents(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(slug: string, current: boolean) {
    setTogglingSlug(slug)
    try {
      await fetch('/api/superadmin/otomasyon/ajanlar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, active: !current }),
      })
      await load()
    } finally {
      setTogglingSlug(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p>Ajanlar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
            🤖 Otomasyon Ajanları
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {agents.filter(a => a.active).length}/{agents.length} ajan aktif
          </p>
        </div>
        <Link
          href="/superadmin/otomasyon/pipeline"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          🔗 Pipeline Görünümü
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const icon = ROLE_ICONS[agent.role] || '🤖'
          const hasPrompt = agent.role !== 'media' && agent.role !== 'publisher'

          return (
            <div
              key={agent.slug}
              className={`rounded-2xl border p-5 transition-all ${
                agent.active
                  ? 'border-[var(--border)] bg-[var(--bg-card)]'
                  : 'border-dashed border-[var(--border)] bg-[var(--bg-primary)] opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      {agent.name}
                      {agent.isCritical && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">KRİTİK</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{agent.description}</div>
                  </div>
                </div>
                <div className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${
                  agent.active ? 'bg-green-500/10 text-green-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                }`}>
                  {agent.active ? '🟢 AKTİF' : '⚫ PASİF'}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3 text-xs text-[var(--text-muted)] font-mono">
                <span>Model: <span className="text-[var(--text-primary)]">{agent.model}</span></span>
                {hasPrompt && (
                  <span>Prompt v<span className="text-[var(--text-primary)]">{agent.promptVersion}</span></span>
                )}
              </div>

              {/* Last run */}
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4">
                {agent.lastRun ? (
                  <>
                    <span>Son çalışma: {formatDistanceToNow(new Date(agent.lastRun), { addSuffix: true, locale: tr })}</span>
                    <span className={agent.lastStatus === 'success' ? 'text-green-400' : 'text-red-400'}>
                      {agent.lastStatus === 'success' ? '✅' : '❌'}
                    </span>
                  </>
                ) : (
                  <span>Henüz çalışmadı</span>
                )}
                <span className="ml-auto">{agent.runCount}x çalıştı</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {hasPrompt && (
                  <Link
                    href={`/superadmin/otomasyon/ajanlar/${agent.slug}/prompt`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                  >
                    📝 Prompt Editörü
                  </Link>
                )}
                <button
                  onClick={() => toggleActive(agent.slug, agent.active)}
                  disabled={togglingSlug === agent.slug}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    agent.active
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  }`}
                >
                  {agent.active ? '🔴 Durdur' : '▶ Aktifleştir'}
                </button>
              </div>

              {/* Cost summary */}
              {agent.runCount > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span>💰 ${agent.totalCost.toFixed(4)}</span>
                  <span>🔤 {agent.totalTokens.toLocaleString()} token</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
