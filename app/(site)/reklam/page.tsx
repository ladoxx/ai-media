import { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageHero } from '@/components/site/StaticPageHero'

export const metadata: Metadata = { title: 'Reklam | Cyba' }

const formats = [
  { name: 'Leaderboard', size: '728×90', desc: 'Sayfa üstü banner', price: 'İletişime geçin' },
  { name: 'Rectangle',   size: '300×250', desc: 'Sidebar widget',  price: 'İletişime geçin' },
  { name: 'Sponsored',   size: 'Makale',  desc: 'Sponsorlu içerik', price: 'İletişime geçin' },
  { name: 'Newsletter',  size: 'E-posta', desc: 'Bülten sponsoru', price: 'İletişime geçin' },
]

export default function ReklamPage() {
  return (
    <div>
      <StaticPageHero title="Reklam" description="Cyba'nda yerinizi alın" icon="📢" />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Stats */}
        <section className="bg-gradient-to-r from-dark-bg via-dark-card to-dark-bg rounded-2xl border border-dark-border p-8 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: '50K+', label: 'Aylık Ziyaretçi' },
              { val: '2K+',  label: 'Bülten Abonesi' },
              { val: '4',    label: 'Kategori' },
              { val: '18-45', label: 'Hedef Yaş Grubu' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-2xl font-display font-extrabold text-white">{val}</div>
                <div className="text-sm text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Formats */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-6">Reklam Formatları</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formats.map((f) => (
              <div key={f.name} className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">{f.name}</h3>
                  <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded">{f.size}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{f.desc}</p>
                <p className="text-xs text-accent-tech mt-2 font-mono">{f.price}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-tech text-dark-bg font-semibold rounded-xl hover:bg-accent-tech/90 transition-colors">
            Reklam Teklifi Al →
          </Link>
        </div>
      </div>
    </div>
  )
}
