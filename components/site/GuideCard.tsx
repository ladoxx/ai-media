import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Başlangıç', color: 'bg-green-500/10 text-green-400' },
  intermediate: { label: 'Orta Seviye', color: 'bg-yellow-500/10 text-yellow-400' },
  advanced:     { label: 'İleri Seviye', color: 'bg-red-500/10 text-red-400' },
}

interface GuideCardPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  readTime: number
  createdAt: Date | string
  category: { name: string; slug: string; color: string; icon: string; parentId?: string | null; parent?: { slug: string } | null }
  author: { name: string }
  tags?: Array<{ tag: { name: string; slug: string } }>
}

interface GuideCardProps {
  post: GuideCardPost
  variant?: 'default' | 'featured' | 'mini'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tocPreview?: string[]
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = DIFFICULTY_LABELS[difficulty] ?? DIFFICULTY_LABELS.beginner
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${d.color}`}>
      {d.label}
    </span>
  )
}

export function GuideCard({ post, variant = 'default', difficulty = 'beginner', tocPreview = [] }: GuideCardProps) {
  const { category } = post
  const catPath = category.parent ? `${category.parent.slug}/${category.slug}` : category.slug
  const href = `/${catPath}/${post.slug}`

  if (variant === 'mini') {
    return (
      <Link href={href} className="flex gap-3 group py-3 border-b border-[var(--border)] last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wide">REHBER</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{post.readTime} dk okuma • {formatDate(post.createdAt)}</p>
        </div>
        {post.coverImage && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        )}
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={href} className="block group relative rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
        {post.coverImage && (
          <div className="relative h-56 overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-blue-600 text-white font-semibold tracking-wider">📚 REHBER</span>
              <DifficultyBadge difficulty={difficulty} />
            </div>
          </div>
        )}
        <div className="p-5">
          <h3 className="font-display font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors leading-snug text-lg line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">{post.excerpt}</p>
          )}
          {tocPreview.length > 0 && (
            <ul className="mt-3 space-y-1">
              {tocPreview.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="text-blue-400 font-mono">{i + 1}.</span>
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
            <span>📖 {post.readTime} dk okuma</span>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={href} className="group block bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
      {post.coverImage ? (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold tracking-wider">📚 REHBER</span>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-600/20 to-[var(--bg-primary)] flex items-center justify-center relative">
          <span className="text-5xl opacity-30">📚</span>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold tracking-wider">📚 REHBER</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <DifficultyBadge difficulty={difficulty} />
          <span className="text-xs text-[var(--text-muted)] font-mono">{post.readTime} dk okuma</span>
        </div>
        <h3 className="font-display font-semibold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug text-base">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        {tocPreview.length > 0 && (
          <ul className="mt-3 space-y-0.5">
            {tocPreview.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="text-blue-400 font-mono text-[10px]">{i + 1}.</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>📅</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
