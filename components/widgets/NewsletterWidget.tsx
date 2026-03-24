'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props { settings: Record<string, string> }

export function NewsletterWidget({ settings }: Props) {
  const title = settings.title ?? '📬 Bülten'
  const subtitle = settings.subtitle ?? 'Günlük haberleri kaçırma.'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  return (
    <div className="bg-gradient-to-br from-[var(--color-accent-tech,#00c896)]/10 to-[var(--color-accent-crypto,#f7931a)]/10 rounded-2xl border border-[var(--color-accent-tech,#00c896)]/20 p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">{subtitle}</p>
      {status === 'ok' ? (
        <p className="text-sm text-[var(--color-accent-tech,#00c896)] font-medium">✅ Abone oldunuz!</p>
      ) : (
        <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ornek.com"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent-tech,#00c896)] transition-colors"
          />
          <Button type="submit" loading={status === 'loading'} className="w-full">Abone Ol</Button>
          {status === 'err' && <p className="text-xs text-red-400">Bir hata oluştu. Tekrar deneyin.</p>}
        </form>
      )}
    </div>
  )
}
