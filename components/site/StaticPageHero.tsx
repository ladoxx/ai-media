import { Breadcrumb } from '@/components/site/Breadcrumb'

interface StaticPageHeroProps {
  title: string
  description?: string
  icon?: string
}

export function StaticPageHero({ title, description, icon }: StaticPageHeroProps) {
  return (
    <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-primary)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Breadcrumb items={[{ label: title }]} />
        <div className="mt-4 flex items-center gap-4">
          {icon && <span className="text-4xl">{icon}</span>}
          <div>
            <h1 className="text-3xl font-display font-extrabold text-[var(--text-primary)]">{title}</h1>
            {description && <p className="mt-1 text-[var(--text-muted)]">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
