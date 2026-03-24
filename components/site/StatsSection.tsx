'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface StatItemProps {
  target: number
  suffix?: string
  label: string
  icon: string
}

function StatItem({ target, suffix = '', label, icon }: StatItemProps) {
  const { count, ref } = useCountUp<HTMLDivElement>(target)
  return (
    <div className="text-center" ref={ref}>
      <div className="text-3xl font-display font-extrabold text-white mb-1">
        {count}{suffix}
      </div>
      <div className="text-sm text-white/60 font-mono">{icon} {label}</div>
    </div>
  )
}

interface StatsSectionProps {
  totalPosts: number
  categoryCount: number
}

export function StatsSection({ totalPosts, categoryCount }: StatsSectionProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-dark-bg via-dark-card to-dark-bg border border-dark-border p-8 mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x-0 md:divide-x divide-dark-border">
        <StatItem target={totalPosts || 500} suffix="+" label="Makale" icon="📰" />
        <StatItem target={categoryCount || 4} label="Kategori" icon="🗂️" />
        <StatItem target={1} label="Günlük Güncelleme" icon="🔄" suffix="x" />
        <StatItem target={2} label="Dil Desteği" icon="🌐" />
      </div>
    </section>
  )
}
