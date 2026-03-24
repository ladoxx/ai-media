import type { Page } from '@/app/generated/prisma/client'

interface Props { page: Page }

export function LandingTemplate({ page }: Props) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-display font-extrabold text-4xl text-[var(--text-primary)] mb-6 text-center">{page.title}</h1>
        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  )
}
