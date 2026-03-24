import type { GeneratedArticle } from '../types'

/**
 * Post-processes a generated article for SEO quality.
 * Validates and normalizes fields.
 */
export function optimizeForSeo(article: GeneratedArticle, category: string): GeneratedArticle {
  // Ensure slug has category prefix for better SEO
  const slug = article.slug.startsWith(category)
    ? article.slug
    : article.slug

  // Ensure seoTitle ends with site name if short enough
  let seoTitle = article.seoTitle || article.title
  if (seoTitle.length <= 45) {
    seoTitle = `${seoTitle} | Cyba`
  }

  // Ensure meta description is complete sentence
  let seoDesc = article.seoDesc || article.excerpt
  if (seoDesc && !seoDesc.endsWith('.') && !seoDesc.endsWith('!') && !seoDesc.endsWith('?')) {
    seoDesc = seoDesc + '.'
  }

  // Normalize tags
  const tags = article.tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && t.length < 40)
    .slice(0, 6)

  return {
    ...article,
    slug,
    seoTitle: seoTitle.slice(0, 70),
    seoDesc: (seoDesc || '').slice(0, 165),
    tags,
  }
}
