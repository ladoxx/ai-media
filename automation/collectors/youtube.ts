import { isSeenBefore } from '../utils/db'
import { ONE_DAY_MS } from '../config'
import type { NewsItem, LogFn } from '../types'

export async function collectYouTube(
  queries: string[],
  log: LogFn = console.log,
): Promise<NewsItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    await log('⚠️ YOUTUBE_API_KEY tanımlı değil, YouTube atlanıyor')
    return []
  }

  const items: NewsItem[] = []
  const publishedAfter = new Date(Date.now() - ONE_DAY_MS).toISOString()

  for (const q of queries) {
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&q=${encodeURIComponent(q)}&type=video` +
        `&order=viewCount&publishedAfter=${publishedAfter}&maxResults=5&key=${apiKey}`

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) {
        await log(`⚠️ YouTube API hata: ${res.status}`)
        continue
      }

      const data = (await res.json()) as {
        items?: Array<{
          id?: { videoId?: string }
          snippet?: { title?: string; description?: string; publishedAt?: string }
        }>
      }

      for (const item of data.items || []) {
        const videoId = item.id?.videoId
        const snippet = item.snippet
        if (!videoId || !snippet?.title) continue

        const link = `https://www.youtube.com/watch?v=${videoId}`
        if (isSeenBefore(link, snippet.title)) continue

        items.push({
          title: snippet.title,
          url: link,
          summary: (snippet.description || '').slice(0, 400),
          source: 'youtube',
          publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
        })
      }
    } catch (err) {
      await log(`⚠️ YouTube sorgu hatası "${q}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return items
}
