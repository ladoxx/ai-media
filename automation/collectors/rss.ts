import Parser from 'rss-parser'
import { isSeenBefore } from '../utils/db'
import { ONE_DAY_MS, MAX_SOURCE_ITEMS } from '../config'
import type { NewsItem, LogFn } from '../types'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'ParaPusulasi/1.0 RSS Reader' },
})

export async function collectRSS(
  urls: string[],
  log: LogFn = console.log,
): Promise<NewsItem[]> {
  const items: NewsItem[] = []

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url)

      for (const item of (feed.items || []).slice(0, MAX_SOURCE_ITEMS)) {
        if (!item.title || !item.link) continue

        // Filter last 24 hours
        if (item.pubDate) {
          const age = Date.now() - new Date(item.pubDate).getTime()
          if (age > ONE_DAY_MS) continue
        }

        if (isSeenBefore(item.link, item.title)) continue

        items.push({
          title: item.title.trim(),
          url: item.link,
          summary: (item.contentSnippet || item.content || item.summary || '').slice(0, 600).trim(),
          source: `rss:${new URL(url).hostname}`,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        })
      }
    } catch (err) {
      await log(`⚠️ RSS hata: ${url.slice(0, 60)} — ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return items
}
