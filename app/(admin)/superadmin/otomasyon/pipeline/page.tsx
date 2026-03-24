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
  active: boolean
  isCritical: boolean
  platformSlug: string
  model: string
  promptVersion: number
  lastRun: string | null
  lastStatus: string | null
  runCount: number
}

const PIPELINE_LAYOUT: { slug: string; icon: string; label: string; hasPrompt: boolean }[][] = [
  [
    { slug: 'scout',  icon: '🕵️', label: 'Scout Ajanı',     hasPrompt: true },
    { slug: 'writer', icon: '✍️', label: 'Writer Ajanı',    hasPrompt: true },
    { slug: 'editor', icon: '🧠', label: 'Editor Ajanı',    hasPrompt: true },
  ],
  [
    { slug: 'publisher', icon: '🚀', label: 'Publisher Ajanı', hasPrompt: false },
    { slug: 'media',     icon: '🖼️', label: 'Media Ajanı',     hasPrompt: false },
    { slug: 'seo',       icon: '💰', label: 'SEO Ajanı',        hasPrompt: true },
  ],
]

export default function PipelinePage() {
  const [agents, setAgents] = useState<Record<string, Agent>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/otomasyon/ajanlar')
      .then((r) => r.json())
      .then((data: Agent[]) => {
        const map: Record<string, Agent> = {}
        for (const a of data) map[a.slug] = a
        setAgents(map)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p>Pipeline yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
            🔗 Pipeline Diyagramı
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Multi-Agent akış diyagramı — her kutucuk bir ajanı temsil eder
          </p>
        </div>
        <Link
          href="/superadmin/otomasyon/ajanlar"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          🤖 Ajan Listesi
        </Link>
      </div>

      {/* Row 1 — Scout → Writer → Editor */}
      <div className="flex items-stretch gap-0 mb-2">
        {PIPELINE_LAYOUT[0].map((item, idx) => {
          const agent = agents[item.slug]
          return (
            <div key={item.slug} className="flex items-center flex-1">
              <AgentCard agent={agent} item={item} />
              {idx < PIPELINE_LAYOUT[0].length - 1 && (
                <div className="flex-shrink-0 flex items-center px-2">
                  <div className="text-[var(--text-muted)] text-xl">▶</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Down arrow between rows */}
      <div className="flex justify-end pr-[33%] my-2">
        <div className="text-[var(--text-muted)] text-xl">▼</div>
      </div>

      {/* Row 2 — Publisher ← Media ← SEO (reverse order displayed right-to-left) */}
      <div className="flex items-stretch gap-0 flex-row-reverse">
        {PIPELINE_LAYOUT[1].map((item, idx) => {
          const agent = agents[item.slug]
          return (
            <div key={item.slug} className="flex items-center flex-1 flex-row-reverse">
              <AgentCard agent={agent} item={item} />
              {idx < PIPELINE_LAYOUT[1].length - 1 && (
                <div className="flex-shrink-0 flex items-center px-2">
                  <div className="text-[var(--text-muted)] text-xl">◀</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-10 flex items-center gap-6 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          Aktif
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--bg-card)] border border-[var(--border)] inline-block"></span>
          Pasif
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-mono">KRİTİK</span>
          Hata verirse pipeline durur
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">📝</span>
          Prompt düzenlenebilir
        </div>
      </div>
    </div>
  )
}

function AgentCard({
  agent,
  item,
}: {
  agent: Agent | undefined
  item: { slug: string; icon: string; label: string; hasPrompt: boolean }
}) {
  const active = agent?.active ?? true
  const critical = agent?.isCritical ?? false
  const lastStatus = agent?.lastStatus
  const lastRun = agent?.lastRun

  return (
    <div
      className={`flex-1 rounded-2xl border p-4 transition-all min-w-0 ${
        active
          ? 'border-[var(--border)] bg-[var(--bg-card)]'
          : 'border-dashed border-[var(--border)] bg-[var(--bg-primary)] opacity-50'
      }`}
    >
      {/* Icon + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{item.icon}</span>
        <div className="flex items-center gap-1.5">
          {critical && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">KRİTİK</span>
          )}
          <span className={`text-xs font-semibold ${active ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
            {active ? '🟢' : '⚫'}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="font-semibold text-sm text-[var(--text-primary)] mb-0.5 truncate">{item.label}</div>

      {/* Model */}
      <div className="text-xs text-[var(--text-muted)] mb-1 font-mono truncate">
        {agent ? `${agent.platformSlug}/${agent.model}` : '—'}
      </div>

      {/* Prompt version */}
      {item.hasPrompt && agent && (
        <div className="text-xs text-[var(--text-muted)] mb-2">
          Prompt v{agent.promptVersion}
        </div>
      )}
      {!item.hasPrompt && (
        <div className="text-xs text-[var(--text-muted)] mb-2">Kod tabanlı</div>
      )}

      {/* Last run */}
      <div className="text-[10px] text-[var(--text-muted)] mb-3">
        {lastRun ? (
          <span>
            {lastStatus === 'success' ? '✅' : '❌'}{' '}
            {formatDistanceToNow(new Date(lastRun), { addSuffix: true, locale: tr })}
          </span>
        ) : (
          'Henüz çalışmadı'
        )}
      </div>

      {/* Prompt link */}
      {item.hasPrompt && (
        <Link
          href={`/superadmin/otomasyon/ajanlar/${item.slug}/prompt`}
          className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
        >
          📝 Prompt
        </Link>
      )}
    </div>
  )
}
