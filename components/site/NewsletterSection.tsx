'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrMsg('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('ok')
      } else {
        setStatus('err')
        setErrMsg(data.error ?? 'Bir hata oluştu.')
      }
    } catch {
      setStatus('err')
      setErrMsg('Bağlantı hatası. Tekrar deneyin.')
    }
  }

  return (
    <section id="newsletter" className="mt-16 rounded-2xl bg-gradient-to-br from-accent-tech/20 via-dark-card to-accent-crypto/20 border border-accent-tech/20 p-10 text-center">
      {status === 'ok' ? (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="w-12 h-12 text-accent-tech" />
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Abone oldunuz! 🎉</h2>
          <p className="text-[var(--text-muted)]">Günlük haberleri e-posta ile alacaksınız.</p>
        </div>
      ) : (
        <>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-tech/10 border border-accent-tech/20 rounded-2xl mb-5">
            <Mail className="w-7 h-7 text-accent-tech" />
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] mb-2">
            Haberleri Kaçırma
          </h2>
          <p className="text-[var(--text-muted)] mb-2">
            Teknoloji, kripto, gayrimenkul ve oyun dünyasından günlük derleme.
          </p>
          <p className="text-sm text-accent-tech font-mono mb-6">
            ✓ 2.000+ kişi zaten abone
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-posta adresiniz"
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech transition-colors"
            />
            <Button type="submit" loading={status === 'loading'} size="lg">
              Abone Ol
            </Button>
          </form>
          {status === 'err' && (
            <p className="mt-3 text-sm text-red-400">{errMsg}</p>
          )}
        </>
      )}
    </section>
  )
}
