import type { Page } from '@/app/generated/prisma/client'

interface Props { page: Page }

export function ContactTemplate({ page }: Props) {
  return (
    <div>
      <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="font-display font-extrabold text-3xl text-[var(--text-primary)]">{page.title}</h1>
          {page.excerpt && <p className="mt-2 text-[var(--text-muted)]">{page.excerpt}</p>}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <article
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          {/* Contact Form */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-5">Mesaj Gönder</h2>
            <form className="space-y-4" action="/api/iletisim" method="POST">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Ad Soyad</label>
                <input name="name" type="text" required className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-accent-tech" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">E-posta</label>
                <input name="email" type="email" required className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-accent-tech" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Konu</label>
                <input name="subject" type="text" className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-accent-tech" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Mesaj</label>
                <textarea name="message" rows={5} required className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-accent-tech resize-none" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-accent-tech text-dark-bg font-semibold rounded-lg hover:bg-accent-tech/90 transition-colors">
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
