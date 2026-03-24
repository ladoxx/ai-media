'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { TrendingUp, Flame } from 'lucide-react'
import { AdZone } from '@/components/site/AdZone'

interface TrendPost { id: string; title: string; slug: string; category: { slug: string }; createdAt: Date | string }

interface SidebarProps {
  trendPosts?: TrendPost[]
}

const CRYPTO_PRICES = [
  { symbol: 'BTC', name: 'Bitcoin',  price: '$67,234', change: '+2.4%', up: true },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,521',  change: '+1.8%', up: true },
  { symbol: 'BNB', name: 'BNB',      price: '$412',    change: '+1.1%', up: true },
  { symbol: 'SOL', name: 'Solana',   price: '$178',    change: '+5.2%', up: true },
]

export function Sidebar({ trendPosts = [] }: SidebarProps) {
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
    <aside className="space-y-6">

      {/* Sidebar Üst Reklam */}
      <AdZone slug="sidebar-top" />

      {/* Widget 1: Trend Haberler */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-accent-crypto" />
          <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">
            Trend Haberler
          </h3>
        </div>
        {trendPosts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Henüz haber yok.</p>
        ) : (
          <ol className="space-y-4">
            {trendPosts.slice(0, 5).map((post, i) => (
              <li key={post.id} className="flex gap-3">
                <span className="text-2xl font-display font-extrabold text-[var(--border)] flex-shrink-0 w-7 leading-none">
                  {i + 1}
                </span>
                <div>
                  <Link
                    href={`/${post.category.slug}/${post.slug}`}
                    className="text-sm font-medium text-[var(--text-primary)] hover:text-accent-tech transition-colors line-clamp-2 leading-snug"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{formatDate(post.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Widget 2: Canlı Fiyatlar */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-tech" />
          <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">
            Canlı Fiyatlar
          </h3>
        </div>
        <div className="space-y-3">
          {CRYPTO_PRICES.map((coin) => (
            <div key={coin.symbol} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{coin.symbol}</p>
                <p className="text-xs text-[var(--text-muted)]">{coin.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">{coin.price}</p>
                <p className={`text-xs font-mono ${coin.up ? 'text-accent-tech' : 'text-red-400'}`}>
                  {coin.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 3: Newsletter */}
      <div className="bg-gradient-to-br from-accent-tech/10 to-accent-crypto/10 rounded-2xl border border-accent-tech/20 p-5">
        <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">📬 Bülten</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Günlük haberleri kaçırma.</p>
        {status === 'ok' ? (
          <p className="text-sm text-accent-tech font-medium">✅ Abone oldunuz!</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ornek.com"
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech transition-colors"
            />
            <Button type="submit" loading={status === 'loading'} className="w-full">
              Abone Ol
            </Button>
            {status === 'err' && (
              <p className="text-xs text-red-400">Bir hata oluştu. Tekrar deneyin.</p>
            )}
          </form>
        )}
      </div>

      {/* Sidebar Orta Reklam */}
      <AdZone slug="sidebar-middle" />

      {/* Sidebar Alt Reklam */}
      <AdZone slug="sidebar-bottom" />

    </aside>
  )
}
