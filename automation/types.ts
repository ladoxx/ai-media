export interface NewsItem {
  title: string
  url: string
  summary: string
  source: string
  publishedAt: Date
}

export interface GeneratedArticle {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  seoTitle: string
  seoDesc: string
  readTime: number
}

export interface PublishResult {
  success: boolean
  postId?: string
  slug?: string
  url?: string
  error?: string
}

export type LogFn = (message: string) => void | Promise<void>

export interface RunResult {
  category: string
  collected: number
  published: number
  errors: string[]
  duration: number
  articles: { title: string; url: string }[]
}
