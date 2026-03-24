interface Props { settings: Record<string, string> }

export function AdWidget({ settings }: Props) {
  const code = settings.code?.trim()
  const size = settings.size ?? '300x250'
  const [w, h] = size.split('x').map(Number)

  if (code) {
    return (
      <div
        className="overflow-hidden"
        style={{ maxWidth: w ? `${w}px` : '100%' }}
        dangerouslySetInnerHTML={{ __html: code }}
      />
    )
  }

  return (
    <div
      className="bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center"
      style={{ height: h ? `${Math.min(h, 300)}px` : '250px' }}
    >
      <div className="text-center text-[var(--text-muted)]">
        <p className="text-2xl mb-2">📢</p>
        <p className="text-xs uppercase tracking-widest font-mono">Reklam Alanı</p>
        <p className="text-xs mt-1">{size}</p>
      </div>
    </div>
  )
}
