'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchWidget() {
  const [q, setQ] = useState('')
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/ara?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-widest mb-3">🔍 Ara</h3>
      <form onSubmit={submit} className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Haberlerde ara..."
          className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-accent-tech,#00c896)] transition-colors"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--color-accent-tech,#00c896)] transition-colors">
          <Search size={15} />
        </button>
      </form>
    </div>
  )
}
