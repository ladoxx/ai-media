'use client'

import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export function GuideTocSidebar({ tocItems }: { tocItems: TocItem[] }) {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    if (tocItems.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-15% 0% -75% 0%', threshold: 0 },
    )

    const headings = document.querySelectorAll('h2[id], h3[id]')
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [tocItems.length])

  if (tocItems.length === 0) return null

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-blue-400">📑</span>
          İçindekiler
          <span className="text-xs text-[var(--text-muted)] font-normal ml-auto">{tocItems.length} bölüm</span>
        </h3>
      </div>
      <nav className="px-4 py-3 max-h-[60vh] overflow-y-auto">
        <ol className="space-y-0.5">
          {tocItems.map((item, i) => (
            <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.75rem' : '0' }}>
              <a
                href={`#${item.id}`}
                className={`flex items-start gap-2 py-1.5 px-2 text-xs rounded-lg transition-all duration-150 ${
                  activeSection === item.id
                    ? 'text-blue-400 bg-blue-400/10 font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                <span className="font-mono text-blue-400/60 shrink-0 mt-0.5 text-[10px]">{i + 1}.</span>
                <span className="leading-snug">{item.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
