import * as cheerio from 'cheerio'
import type { LogFn } from '../types'

export interface ScrapedContent {
  title?: string
  text: string
  imageUrl?: string
}

const BLOCKLIST = [
  'google.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'youtube.com', 'reddit.com', 'tiktok.com',
]

export async function scrapeArticle(url: string, log: LogFn = console.log): Promise<ScrapedContent | null> {
  try {
    if (BLOCKLIST.some((d) => url.includes(d))) {
      return null
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ParaPusulasi/1.0; +https://cyba.com.tr)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove noise
    $('script, style, nav, header, footer, aside, .ad, .advertisement, [class*="comment"]').remove()

    // Try to find main content
    const articleText =
      $('article').text() ||
      $('main').text() ||
      $('[class*="content"]').first().text() ||
      $('body').text()

    // Clean up whitespace
    const text = articleText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    // Try to find OG image
    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      undefined

    return { title, text, imageUrl }
  } catch (err) {
    await log(`⚠️ Scrape hatası ${url.slice(0, 60)}: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}
