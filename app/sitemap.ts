import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cyba.com.tr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/haber/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = [
    'teknoloji',
    'kripto',
    'gayrimenkul',
    'oyun',
  ].map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0 },
    { url: `${BASE_URL}/hakkimizda`, priority: 0.5 },
    { url: `${BASE_URL}/iletisim`, priority: 0.5 },
    { url: `${BASE_URL}/gizlilik`, priority: 0.3 },
    { url: `${BASE_URL}/kvkk`, priority: 0.3 },
    { url: `${BASE_URL}/cerez-politikasi`, priority: 0.3 },
    { url: `${BASE_URL}/reklam`, priority: 0.4 },
  ].map((entry) => ({
    ...entry,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: entry.priority,
  }))

  return [...staticEntries, ...categoryEntries, ...postEntries]
}
