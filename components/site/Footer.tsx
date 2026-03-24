import Link from 'next/link'
import { Compass, Twitter, Youtube, Send, Rss } from 'lucide-react'
import type { MenuItemData } from '@/lib/menus'

const STATIC_CATEGORIES = [
  { href: '/teknoloji',   label: 'Teknoloji',   icon: '💻' },
  { href: '/kripto',      label: 'Kripto',       icon: '₿'  },
  { href: '/gayrimenkul', label: 'Gayrimenkul',  icon: '🏠' },
  { href: '/oyun',        label: 'Oyun',         icon: '🎮' },
]

const STATIC_PAGES = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim',   label: 'İletişim' },
  { href: '/reklam',     label: 'Reklam' },
  { href: '/yazarlar',   label: 'Yazarlar' },
]

const BOTTOM_LINKS = [
  { href: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
  { href: '/kvkk',               label: 'KVKK' },
  { href: '/cerez-politikasi',   label: 'Çerez Politikası' },
]

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter:   <Twitter className="w-4 h-4" />,
  youtube:   <Youtube className="w-4 h-4" />,
  telegram:  <Send className="w-4 h-4" />,
  instagram: <Send className="w-4 h-4" />,
  rss:       <Rss className="w-4 h-4" />,
}

interface FooterProps {
  menuCategories?: MenuItemData[]
  menuPages?: MenuItemData[]
  menuSocial?: MenuItemData[]
}

export function Footer({ menuCategories = [], menuPages = [], menuSocial = [] }: FooterProps) {
  type NavLink = { label: string; url: string; icon?: string | null; id?: string }
  const cats: NavLink[]  = menuCategories.length > 0
    ? menuCategories
    : STATIC_CATEGORIES.map((c) => ({ ...c, url: c.href }))
  const pages: NavLink[] = menuPages.length > 0
    ? menuPages
    : STATIC_PAGES.map((p) => ({ ...p, url: p.href }))

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent-tech/10 rounded-lg flex items-center justify-center">
                <Compass className="w-5 h-5 text-accent-tech" />
              </div>
              <span className="font-display font-extrabold text-lg">
                <span className="text-[var(--text-primary)]">Para</span>
                <span className="text-accent-tech"> Pusulası</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
              Teknoloji, kripto, gayrimenkul ve oyun dünyasından güncel haberler.
            </p>
            <div className="flex gap-3">
              {menuSocial.length > 0 ? (
                menuSocial.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target={item.target}
                    rel="noopener noreferrer"
                    title={item.label}
                    className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-accent-tech hover:border-accent-tech/30 transition-all"
                  >
                    {item.icon ? (
                      <span className="text-base leading-none">{item.icon}</span>
                    ) : (
                      SOCIAL_ICONS[item.label.toLowerCase()] ?? <Send className="w-4 h-4" />
                    )}
                  </a>
                ))
              ) : (
                [Twitter, Youtube, Send, Rss].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-accent-tech hover:border-accent-tech/30 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-display font-bold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
              Kategoriler
            </h4>
            <ul className="space-y-2">
              {cats.map((cat, i) => (
                <li key={cat.id ?? i}>
                  <Link
                    href={cat.url}
                    className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Pages */}
          <div>
            <h4 className="font-display font-bold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
              Sayfalar
            </h4>
            <ul className="space-y-2">
              {pages.map((page, i) => (
                <li key={page.id ?? i}>
                  <Link
                    href={page.url}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4 className="font-display font-bold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-widest">
              Bülten
            </h4>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Günlük haberleri e-posta ile al.
            </p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="email@ornek.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent-tech transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-accent-tech text-dark-bg text-sm font-semibold rounded-lg hover:bg-accent-tech/90 transition-colors"
              >
                Abone Ol
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © 2024 Cyba. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-5 text-xs text-[var(--text-muted)]">
            {BOTTOM_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[var(--text-primary)] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
