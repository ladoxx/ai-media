import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { formatDate, truncateText } from '@/lib/utils'

interface NewsCardPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  readTime: number
  createdAt: Date | string
  category: { name: string; slug: string; color: string; icon: string }
  author: { name: string }
}

interface NewsCardProps {
  post: NewsCardPost
  variant?: 'default' | 'hero' | 'side' | 'mini'
}

const gradients: Record<string, string> = {
  tech:   'from-accent-tech/20 to-dark-bg',
  crypto: 'from-accent-crypto/20 to-dark-bg',
  real:   'from-accent-real/20 to-dark-bg',
  game:   'from-accent-game/20 to-dark-bg',
}

function CategoryPlaceholder({ color, icon }: { color: string; icon: string }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradients[color] ?? 'from-gray-500/20 to-dark-bg'} flex items-center justify-center`}>
      <span className="text-5xl opacity-40">{icon}</span>
    </div>
  )
}

export function NewsCard({ post, variant = 'default' }: NewsCardProps) {
  const { category } = post
  const href = `/${category.slug}/${post.slug}`

  if (variant === 'mini') {
    return (
      <Link href={href} className="flex gap-3 group py-3 border-b border-[var(--border)] last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-accent-tech transition-colors line-clamp-2 leading-snug">
            {post.title}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(post.createdAt)}</p>
        </div>
        {post.coverImage && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        )}
      </Link>
    )
  }

  if (variant === 'hero') {
    return (
      <Link href={href} className="block group relative rounded-2xl overflow-hidden">
        <div className="relative h-[420px]">
          {post.coverImage ? (
            <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <CategoryPlaceholder color={category.color} icon={category.icon} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge category={category.color} name={category.name} icon={category.icon} />
          <h2 className="mt-3 text-2xl font-display font-bold text-white group-hover:text-accent-tech transition-colors leading-tight line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 text-sm text-white/70 line-clamp-2">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-white/60 font-mono">
            <span>{post.author.name}</span>
            <span>•</span>
            <span>{post.readTime} dk okuma</span>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'side') {
    return (
      <Link href={href} className="flex gap-3 group p-3 rounded-xl hover:bg-[var(--bg-card)] transition-colors">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          {post.coverImage ? (
            <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <CategoryPlaceholder color={category.color} icon={category.icon} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Badge category={category.color} name={category.name} icon={category.icon} size="sm" />
          <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)] group-hover:text-accent-tech transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">{formatDate(post.createdAt)}</p>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={href} className="group block bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <CategoryPlaceholder color={category.color} icon={category.icon} />
        )}
        <div className="absolute top-3 left-3">
          <Badge category={category.color} name={category.name} icon={category.icon} size="sm" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-2">
          <span>{post.readTime} dk okuma</span>
        </div>
        <h3 className="font-display font-semibold text-[var(--text-primary)] group-hover:text-accent-tech transition-colors line-clamp-2 leading-snug text-base">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {truncateText(post.excerpt, 100)}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>📅</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
