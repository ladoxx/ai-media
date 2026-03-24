import type { GeneratedArticle, PublishResult, LogFn } from '../types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || ''

export async function publishArticle(
  article: GeneratedArticle,
  category: string,
  coverImage: string | null,
  log: LogFn = console.log,
): Promise<PublishResult> {
  if (!AUTOMATION_SECRET) {
    await log('❌ AUTOMATION_SECRET tanımlı değil')
    return { success: false, error: 'AUTOMATION_SECRET eksik' }
  }

  try {
    const res = await fetch(`${APP_URL}/api/otomasyon/yayinla`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTOMATION_SECRET}`,
      },
      body: JSON.stringify({
        ...article,
        category,
        coverImage,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { success: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` }
    }

    const data = (await res.json()) as PublishResult
    return data
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
