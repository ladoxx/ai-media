import { AutomationPipeline } from './pipeline'
import { GuidePipeline } from './guide-pipeline'
import type { PipelineLogFn } from './pipeline'
import { createLogger } from './utils/logger'
import type { LogFn } from './types'
import { ALL_CATEGORIES, GUIDE_CATEGORY_SLUGS, getCategorySlugTail } from './config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || ''

// All slugs from config (full slugs like 'finans/borsa')
const ALL_CATEGORY_SLUGS = ALL_CATEGORIES.map(c => c.slug)

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export interface RunResult {
  category: string
  published: number
  collected: number
  errors: string[]
  duration: number
  articles: { title: string; url: string }[]
}

/**
 * Determine if a given slug (full or tail) belongs to the guide pipeline.
 * Accepts both 'rehberler/nasil-yapilir' and 'nasil-yapilir' formats.
 */
function isGuidePipeline(slug: string): boolean {
  // Check full slug match in config
  const configEntry = ALL_CATEGORIES.find(c => c.slug === slug)
  if (configEntry) return configEntry.pipeline === 'guide'
  // Fall back to tail-based set for backward compatibility
  const tail = getCategorySlugTail(slug)
  return GUIDE_CATEGORY_SLUGS.has(tail)
}

/**
 * Run a single category through the appropriate pipeline.
 * Accepts full slugs ('finans/borsa') or legacy short slugs ('borsa').
 * The pipeline receives only the tail slug for source map lookups.
 */
export async function runCategory(
  slug: string,
  onLog?: LogFn,
): Promise<RunResult> {
  const log = createLogger(onLog, !onLog)
  const start = Date.now()
  const isGuide = isGuidePipeline(slug)

  // Pipeline receives the tail slug to match existing CATEGORY_SOURCE_MAP keys
  const pipelineSlug = getCategorySlugTail(slug)

  const pipeline = isGuide ? new GuidePipeline() : new AutomationPipeline()

  await log(`\n${isGuide ? '📚 Guide' : '📰 News'} Pipeline: ${slug}`)

  const pipelineLog: PipelineLogFn = async (msg) => {
    await log(msg)
  }

  const pipeResult = await pipeline.run(pipelineSlug, pipelineLog)
  const duration = Math.round((Date.now() - start) / 1000)

  return {
    category: slug,
    published: pipeResult.published ? 1 : 0,
    collected: 0,
    errors: pipeResult.error ? [pipeResult.error] : [],
    duration,
    articles: pipeResult.published
      ? [{ title: pipeResult.published.title, url: pipeResult.published.url }]
      : [],
  }
}

export async function runAutomation(
  categoryInput: string,
  onLog?: LogFn,
): Promise<RunResult[]> {
  const log = createLogger(onLog, !onLog)
  const globalStart = Date.now()

  await log('🚀 Cyba Multi-Agent Otomasyon başlatıldı')

  const categories =
    categoryInput === 'all'
      ? ALL_CATEGORY_SLUGS
      : [categoryInput]

  await log(`📋 Kategoriler: ${categories.join(', ')}`)

  const results: RunResult[] = []

  for (const cat of categories) {
    const result = await runCategory(cat, onLog)
    results.push(result)

    // Brief pause between categories
    if (categories.indexOf(cat) < categories.length - 1) {
      await sleep(2000)
    }
  }

  const totalDuration = Math.round((Date.now() - globalStart) / 1000)
  const totalPublished = results.reduce((s, r) => s + r.published, 0)

  await log(`\n🎉 Tamamlandı! ${totalPublished} yazı yayınlandı (${totalDuration}s)`)

  // Send Telegram report
  await sendTelegramReport(results, totalDuration, log)

  // Log to AutoLog table
  if (AUTOMATION_SECRET) {
    const { prisma } = await import('@/lib/db')
    prisma.autoLog.create({
      data: {
        type: 'multi-agent',
        status: totalPublished > 0 ? 'success' : 'info',
        message: `Multi-Agent otomasyon: ${totalPublished} yazı yayınlandı (${categories.join(', ')})`,
      },
    }).catch(() => {})
  }

  return results
}

async function sendTelegramReport(results: RunResult[], totalDuration: number, log: LogFn) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return

  const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const durationStr = totalDuration < 60
    ? `${totalDuration} saniye`
    : `${Math.floor(totalDuration / 60)} dakika ${totalDuration % 60} saniye`

  const totalPublished = results.reduce((s, r) => s + r.published, 0)

  let articleLines = ''
  for (const r of results) {
    for (const a of r.articles) {
      articleLines += `📰 [${a.title.slice(0, 50)}](${a.url})\n`
    }
  }

  const text = `🤖 *Cyba Multi-Agent Raporu*
━━━━━━━━━━━━━━━━━━━━
📅 ${dateStr} - ${timeStr}
⏱ Süre: ${durationStr}

📊 *Toplam:*
✅ ${totalPublished} yazı yayınlandı

✅ *Yayınlanan Yazılar:*
${articleLines || 'Yeni yazı yayınlanmadı'}
🟢 Durum: OK`

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    })
    await log('📱 Telegram raporu gönderildi')
  } catch (err) {
    await log(`⚠️ Telegram hata: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// ── Standalone runner (CLI usage: npx tsx automation/index.ts [category]) ─────
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const category = process.argv[2] || 'all'
  runAutomation(category).then((results) => {
    const total = results.reduce((s, r) => s + r.published, 0)
    console.log(`\nSonuç: ${total} yazı yayınlandı`)
    process.exit(0)
  }).catch((err) => {
    console.error('Otomasyon hatası:', err)
    process.exit(1)
  })
}
// Note: For API-triggered runs, use automation/runner.ts (spawned as child process)
