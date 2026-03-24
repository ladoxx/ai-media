interface BadgeProps {
  category: string
  icon?: string
  name?: string
  size?: 'sm' | 'md'
}

// CSS class → hex renk (yeni sistem)
const CAT_HEX: Record<string, string> = {
  'cat-finans':      '#f7931a',
  'cat-ekonomi':     '#3b82f6',
  'cat-gayrimenkul': '#10b981',
  'cat-oyun':        '#a855f7',
  'cat-teknoloji':   '#00c896',
  'cat-rehber':      '#f59e0b',
  'cat-son-dakika':  '#ef4444',
  'cat-trend':       '#ec4899',
  // Eski sistem
  'tech':   '#00c896',
  'crypto': '#f7931a',
  'real':   '#3b82f6',
  'game':   '#a855f7',
  'money':  '#eab308',
}

export function Badge({ category, icon, name, size = 'md' }: BadgeProps) {
  const hex = CAT_HEX[category] ?? '#6b7280'

  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-3 py-1 text-xs gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider border rounded-full ${sizeClass}`}
      style={{
        background: `${hex}18`,
        color: hex,
        borderColor: `${hex}35`,
      }}
    >
      {icon && <span>{icon}</span>}
      {name && <span>{name}</span>}
    </span>
  )
}
