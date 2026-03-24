import { isSeenBefore } from '../utils/db'
import type { NewsItem, LogFn } from '../types'

const MIN_UPVOTES = 100

export async function collectReddit(
  subreddits: string[],
  log: LogFn = console.log,
): Promise<NewsItem[]> {
  const items: NewsItem[] = []

  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=25`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ParaPusulasi/1.0 (news aggregator)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        await log(`⚠️ Reddit r/${sub} hata: ${res.status}`)
        continue
      }

      const data = (await res.json()) as {
        data?: {
          children?: Array<{
            data?: {
              title?: string
              url?: string
              permalink?: string
              selftext?: string
              score?: number
              created_utc?: number
            }
          }>
        }
      }

      for (const child of data.data?.children || []) {
        const p = child.data
        if (!p?.title || !p?.permalink) continue
        if ((p.score || 0) < MIN_UPVOTES) continue

        const link = `https://reddit.com${p.permalink}`
        if (isSeenBefore(link, p.title)) continue

        items.push({
          title: p.title,
          url: link,
          summary: (p.selftext || '').slice(0, 500).trim(),
          source: `reddit:r/${sub}`,
          publishedAt: p.created_utc ? new Date(p.created_utc * 1000) : new Date(),
        })
      }
    } catch (err) {
      await log(`⚠️ Reddit r/${sub} hata: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return items
}
