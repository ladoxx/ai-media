import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--bg-primary)]">
      <div className="text-center max-w-lg">
        <div className="relative mb-6 select-none">
          <span className="text-[160px] font-display font-extrabold leading-none bg-gradient-to-br from-accent-tech via-accent-crypto to-accent-real bg-clip-text text-transparent">
            404
          </span>
          <div className="absolute inset-0 text-[160px] font-display font-extrabold leading-none text-accent-tech/5 blur-2xl">
            404
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-3">
          Sayfa Bulunamadı
        </h1>
        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-tech text-dark-bg font-semibold rounded-xl hover:bg-accent-tech/90 transition-colors"
          >
            ← Ana Sayfaya Dön
          </Link>
          <Link
            href="/ara"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-xl hover:border-accent-tech/50 transition-colors"
          >
            İçerik Ara
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[
            { href: '/teknoloji', label: '💻 Teknoloji' },
            { href: '/kripto', label: '₿ Kripto' },
            { href: '/gayrimenkul', label: '🏠 Gayrimenkul' },
            { href: '/oyun', label: '🎮 Oyun' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-accent-tech/40 transition-colors text-center"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
