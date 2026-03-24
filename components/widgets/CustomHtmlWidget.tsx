interface Props { settings: Record<string, string> }

export function CustomHtmlWidget({ settings }: Props) {
  const title = settings.title?.trim()
  const content = settings.content?.trim()

  if (!content) return null

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      {title && (
        <h3 className="font-display font-bold text-[var(--text-primary)] text-sm uppercase tracking-widest mb-4">{title}</h3>
      )}
      <div
        className="text-sm text-[var(--text-muted)] prose-sm"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
