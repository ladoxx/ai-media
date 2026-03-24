'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/hooks/useTheme'
import { Moon, Sun, Search, Menu, X, ChevronDown } from 'lucide-react'
import { MENU_CATEGORIES } from '@/lib/categories'

function CybaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyba-ring" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00c8f0" />
          <stop offset="50%" stopColor="#4f6ef7" />
          <stop offset="100%" stopColor="#9b4ff7" />
        </linearGradient>
        <linearGradient id="cyba-inner" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#7b2fff" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="48" cy="54" r="38" stroke="url(#cyba-ring)" strokeWidth="7" fill="none" />
      {/* Y / checkmark */}
      <path d="M30 38 L48 58 L66 32" stroke="url(#cyba-inner)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M48 58 L48 76" stroke="url(#cyba-inner)" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Pixel dots - top right */}
      <rect x="72" y="8"  width="7" height="7" rx="1.5" fill="#00c8f0" opacity="0.9" />
      <rect x="82" y="4"  width="5" height="5" rx="1"   fill="#4f6ef7" opacity="0.8" />
      <rect x="78" y="17" width="5" height="5" rx="1"   fill="#7b2fff" opacity="0.7" />
      <rect x="88" y="13" width="4" height="4" rx="1"   fill="#9b4ff7" opacity="0.6" />
      <rect x="92" y="22" width="3" height="3" rx="0.5" fill="#4f6ef7" opacity="0.5" />
    </svg>
  )
}

const TICKER_ITEMS = [
  { label: 'BTC',     price: '$67,234',  change: '+2.4%',  up: true  },
  { label: 'ETH',     price: '$3,521',   change: '+1.8%',  up: true  },
  { label: 'BIST100', price: '9,847',    change: '-0.3%',  up: false },
  { label: 'USD/TRY', price: '₺32.45',  change: '+0.1%',  up: true  },
  { label: 'GOLD',    price: '$2,341',   change: '+0.7%',  up: true  },
  { label: 'SOL',     price: '$178',     change: '+5.2%',  up: true  },
  { label: 'BNB',     price: '$412',     change: '+1.1%',  up: true  },
  { label: 'EUR/USD', price: '1.082',    change: '-0.2%',  up: false },
]

function MegaMenuDropdown({ cat, onClose }: { cat: typeof MENU_CATEGORIES[0]; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 w-72 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]" style={{ borderLeft: `3px solid ${cat.hex}` }}>
        <span className="text-base font-bold text-[var(--text-primary)]">{cat.icon} {cat.name}</span>
      </div>
      {/* Sub-categories */}
      <div className="py-2">
        <Link
          href={`/${cat.slug}`}
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
        >
          Tümü →
        </Link>
        {cat.children.map((child) => (
          <Link
            key={child.slug}
            href={`/${cat.slug}/${child.slug}`}
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <span className="text-base leading-none w-5">{child.icon}</span>
            <span>{child.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Header() {
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleMouseEnter(slug: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(slug)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <header className="sticky top-0 z-50">
      {/* ── Ticker Band ── */}
      <div className="h-9 bg-[var(--bg-card)] border-b border-[var(--border)] overflow-hidden ticker-wrap">
        <div className="flex items-center h-full ticker-inner animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-5 text-xs font-mono border-r border-[var(--border)]">
              <span className="text-[var(--text-muted)]">{item.label}</span>
              <span className="text-[var(--text-primary)] font-semibold">{item.price}</span>
              <span className={item.up ? 'text-[var(--color-cat-teknoloji)]' : 'text-red-400'}>{item.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Nav ── */}
      <div className="h-16 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <CybaLogo size={36} />
            <span className="font-display font-extrabold text-xl tracking-tight">
              <span style={{ background: 'linear-gradient(135deg, #00c8f0, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Cyba
              </span>
            </span>
          </Link>

          {/* Desktop Nav — Mega Menu */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {MENU_CATEGORIES.map((cat) => (
              <div
                key={cat.slug}
                className="relative"
                onMouseEnter={() => handleMouseEnter(cat.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/${cat.slug}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all duration-200"
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span>{cat.name}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === cat.slug ? 'rotate-180' : ''}`} />
                </Link>
                {activeDropdown === cat.slug && (
                  <MegaMenuDropdown cat={cat} onClose={() => setActiveDropdown(null)} />
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
              aria-label="Tema değiştir"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/ara"
              className="w-9 h-9 rounded-lg hidden md:flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
            >
              <Search className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu (Accordion) ── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-[100px] bg-[var(--bg-primary)]/97 backdrop-blur-lg z-40 overflow-y-auto">
          <div className="p-4 flex flex-col gap-2">
            {MENU_CATEGORIES.map((cat) => (
              <div key={cat.slug} className="rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === cat.slug ? null : cat.slug)}
                  className="w-full flex items-center justify-between px-4 py-4 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    {cat.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${mobileExpanded === cat.slug ? 'rotate-180' : ''}`} />
                </button>
                {mobileExpanded === cat.slug && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-card)]">
                    <Link
                      href={`/${cat.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Tüm {cat.name} Haberleri →
                    </Link>
                    {cat.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/${cat.slug}/${child.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-6 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors border-t border-[var(--border)]/50"
                      >
                        <span className="text-base">{child.icon}</span>
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
