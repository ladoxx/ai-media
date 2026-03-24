export interface User {
  id: string
  email: string
  name: string
  role: 'SUPERADMIN' | 'EDITOR'
  avatar?: string | null
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string | null
  coverImage?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  views: number
  readTime: number
  seoTitle?: string | null
  seoDesc?: string | null
  categoryId: string
  category: Category
  authorId: string
  author: User
  tags: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
}

export interface ApiKey {
  id: string
  name: string
  value: string
  active: boolean
  updatedAt: Date
}

export interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: Date
}

export interface AffiliateLink {
  id: string
  name: string
  url: string
  keywords: string
  clicks: number
  active: boolean
}

export interface Setting {
  id: string
  key: string
  value: string
}
