import { isSeenBefore } from '../utils/db'
import { ONE_DAY_MS } from '../config'
import type { NewsItem, LogFn } from '../types'

export async function collectNewsAPI(
  keywords: string[],
  log: LogFn = console.log,
): Promise<NewsItem[]> {
  const apiKey = process.env.NEWSAPI_KEY
  if (!apiKey) {
    await log('⚠️ NEWSAPI_KEY tanımlı değil, NewsAPI atlanıyor')
    return []
  }

  const items: NewsItem[] = []
  const from = new Date(Date.now() - ONE_DAY_MS).toISOString()

  // Limit queries to avoid quota exhaustion
  for (const q of keywords.slice(0, 2)) {
    try {
      const url =
        `https://newsapi.org/v2/everything` +
        `?q=${encodeURIComponent(q)}&from=${from}&sortBy=publishedAt` +
        `&language=en&pageSize=5&apiKey=${apiKey}`

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        await log(`⚠️ NewsAPI hata "${q}": ${res.status} ${body.slice(0, 100)}`)
        continue
      }

      const data = (await res.json()) as {
        articles?: Array<{
          title?: string
          url?: string
          description?: string
          publishedAt?: string
        }>
      }

      for (const article of data.articles || []) {
        if (!article.title || !article.url) continue
        if (article.title === '[Removed]') continue
        if (isSeenBefore(article.url, article.title)) continue

        items.push({
          title: article.title,
          url: article.url,
          summary: (article.description || '').slice(0, 400),
          source: 'newsapi',
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        })
      }
    } catch (err) {
      await log(`⚠️ NewsAPI sorgu hatası "${q}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return items
}
