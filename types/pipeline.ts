export interface NewsItem {
  title: string
  summary: string
  url: string
  source: string
  date: string
  category: string
}

export interface GuideTopic {
  topic: string
  keywords: string[]
  targetAudience: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedLength: number
  outline: string[]
  sourceUrl: string
  sourceTitle: string
}

export interface PipelineData {
  sessionId: string
  category: string
  rawNews: NewsItem[]
  selectedNews?: NewsItem[]
  // Guide pipeline fields
  guideTopic?: GuideTopic
  guideDraft?: {
    title: string
    slug: string
    content: string
    excerpt: string
    tocItems: string[]
    difficulty: string
    estimatedReadTime: number
  }
  guideEdited?: {
    content: string
    excerpt: string
    tocItems: string[]
  }
  guideSeo?: {
    focusKeyword: string
    seoTitle: string
    seoDescription: string
    optimizedContent: string
    tags: string[]
    readTime: number
    howToSchema: object
    faqSchema: object
  }
  draft?: {
    title: string
    slug: string
    content: string
    excerpt: string
  }
  edited?: {
    title: string
    content: string
    excerpt: string
    changes: string[]
  }
  seo?: {
    focusKeyword: string
    seoTitle: string
    seoDescription: string
    optimizedContent: string
    tags: string[]
    readTime: number
    seoScore: number
  }
  media?: {
    coverPath: string
    ogPath: string
    inlineImages?: Array<{ localPath: string; keyword: string; alt: string }>
  }
  published?: {
    postId: string
    url: string
    title: string
  }
  totalTokens: number
  totalCost: number
}

export interface AgentResult {
  success: boolean
  data: PipelineData
  tokens: number
  cost: number
  duration: number
  error?: string
}
