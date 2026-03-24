import { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageHero } from '@/components/site/StaticPageHero'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Hakkımızda | Cyba',
  description: 'Cyba hakkında bilgi edinin. Misyonumuz, ekibimiz ve değerlerimiz.',
}

export default function HakkimizdaPage() {
  return (
    <div>
      <StaticPageHero
        title="Hakkımızda"
        description="Cyba'nı tanıyın"
        icon="🧭"
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <div className="space-y-10">
            {/* Mission */}
            <section>
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-4">Misyonumuz</h2>
              <p className="text-[var(--text-muted)] leading-relaxed text-lg">
                Cyba olarak amacımız, teknoloji, kripto para, gayrimenkul ve oyun dünyasındaki
                gelişmeleri Türk okuyuculara en hızlı, en doğru ve en anlaşılır şekilde ulaştırmaktır.
                Karmaşık finans ve teknoloji haberlerini herkesin anlayabileceği bir dille sunuyoruz.
              </p>
              <p className="mt-4 text-[var(--text-muted)] leading-relaxed">
                Yatırım kararları verilirken doğru bilgiye ihtiyaç duyulur. Biz bu bilginin güvenilir
                kaynağı olmak için çalışıyoruz.
              </p>
            </section>

            {/* Categories */}
            <section>
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-6">Kapsadığımız Alanlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { color: 'tech',   icon: '💻', name: 'Teknoloji',    desc: 'Yapay zeka, yazılım ve donanım gelişmeleri' },
                  { color: 'crypto', icon: '₿',  name: 'Kripto',       desc: 'Bitcoin, altcoin ve blockchain haberleri' },
                  { color: 'real',   icon: '🏠',  name: 'Gayrimenkul',  desc: 'Konut piyasası ve yatırım fırsatları' },
                  { color: 'game',   icon: '🎮',  name: 'Oyun',         desc: 'Oyun dünyası ve e-spor haberleri' },
                ].map((cat) => (
                  <div key={cat.color} className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] hover:-translate-y-1 transition-transform">
                    <Badge category={cat.color} name={cat.name} icon={cat.icon} />
                    <p className="mt-3 text-sm text-[var(--text-muted)]">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Stats */}
            <section className="bg-gradient-to-r from-dark-bg via-dark-card to-dark-bg rounded-2xl border border-dark-border p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { val: '500+', label: 'Makale' },
                  { val: '4',    label: 'Kategori' },
                  { val: '2K+',  label: 'Abone' },
                  { val: '2',    label: 'Dil' },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-display font-extrabold text-white">{val}</div>
                    <div className="text-sm text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-8">
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-3">İletişime Geçin</h2>
              <p className="text-[var(--text-muted)] mb-6">Reklam, işbirliği veya içerik önerileri için bizimle iletişime geçin.</p>
              <Link href="/iletisim" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-tech text-dark-bg font-semibold rounded-xl hover:bg-accent-tech/90 transition-colors">
                İletişim Formu →
              </Link>
            </section>
          </div>

          {/* Mini Sidebar */}
          <div className="space-y-5">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
              <h3 className="font-display font-bold text-[var(--text-primary)] mb-3">Hızlı Linkler</h3>
              <ul className="space-y-2">
                {[
                  { href: '/teknoloji', label: '💻 Teknoloji Haberleri' },
                  { href: '/kripto',    label: '₿ Kripto Haberleri' },
                  { href: '/gayrimenkul', label: '🏠 Gayrimenkul' },
                  { href: '/oyun',      label: '🎮 Oyun Haberleri' },
                  { href: '/iletisim',  label: '✉️ İletişim' },
                  { href: '/reklam',    label: '📢 Reklam' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
