import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-[var(--text-muted)] flex-wrap">
      <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>Ana Sayfa</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-[var(--border)]" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--text-primary)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-primary)] font-medium line-clamp-1 max-w-xs">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
