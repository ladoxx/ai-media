interface StatsCardProps {
  icon: string
  /** Display label below the value. Alias: `title`. */
  label?: string
  /** Alias for `label` — kept for backward compatibility. */
  title?: string
  value: string | number
  subtitle?: string
  accent?: string
  /** When true, renders the value in muted colour (e.g. placeholder stats). */
  muted?: boolean
}

export function StatsCard({
  icon,
  label,
  title,
  value,
  subtitle,
  accent = '#00c896',
  muted = false,
}: StatsCardProps) {
  const displayLabel = label ?? title ?? ''
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="w-8 h-8 rounded-lg" style={{ background: accent + '18' }} />
      </div>
      <div>
        <div
          className="text-3xl font-display font-extrabold"
          style={{ color: muted ? '#606080' : 'white' }}
        >
          {value}
        </div>
        <div className="text-xs text-[#606080] mt-0.5">{displayLabel}</div>
      </div>
      {subtitle && (
        <div className="text-xs font-mono" style={{ color: accent }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded bg-[#1e1e35]" />
        <div className="w-8 h-8 rounded-lg bg-[#1e1e35]" />
      </div>
      <div className="w-16 h-8 rounded bg-[#1e1e35] mb-1" />
      <div className="w-24 h-3 rounded bg-[#1e1e35]" />
    </div>
  )
}
