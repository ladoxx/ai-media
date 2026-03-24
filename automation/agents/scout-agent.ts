import { BaseAgent } from './base-agent'
import type { PipelineData, NewsItem } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'
import { collectRSS } from '../collectors/rss'
import { collectYouTube } from '../collectors/youtube'
import { collectReddit } from '../collectors/reddit'
import { collectNewsAPI } from '../collectors/newsapi'
import { SOURCES } from '../config'

// Main category slug → source keys to pull from SOURCES config
const CATEGORY_SOURCE_MAP: Record<string, string[]> = {
  // Ana kategoriler
  finans:               ['borsa', 'kripto', 'altin-doviz'],
  ekonomi:              ['turkiye-ekonomisi', 'dunya-ekonomisi', 'enflasyon-faiz', 'sirket-haberleri'],
  gayrimenkul:          ['gayrimenkul', 'konut-projeleri', 'kira-satilik'],
  oyun:                 ['oyun-haberleri', 'pc-konsol', 'e-spor'],
  teknoloji:            ['yapay-zeka', 'startup', 'teknoloji', 'donanim'],
  rehberler:            ['nasil-yapilir', 'para-kazanma', 'yatirim-taktikleri'],
  // Alt kategoriler (doğrudan çalıştırılabilir)
  borsa:                ['borsa'],
  kripto:               ['kripto'],
  'altin-doviz':        ['altin-doviz'],
  'turkiye-ekonomisi':  ['turkiye-ekonomisi'],
  'dunya-ekonomisi':    ['dunya-ekonomisi'],
  'enflasyon-faiz':     ['enflasyon-faiz'],
  'sirket-haberleri':   ['sirket-haberleri'],
  'konut-projeleri':    ['konut-projeleri'],
  'kira-satilik':       ['kira-satilik'],
  'oyun-haberleri':     ['oyun-haberleri'],
  'pc-konsol':          ['pc-konsol'],
  'e-spor':             ['e-spor'],
  'yapay-zeka':         ['yapay-zeka'],
  startup:              ['startup'],
  donanim:              ['donanim'],
  // Rehberler alt kategorileri
  'nasil-yapilir':      ['nasil-yapilir'],
  'para-kazanma':       ['para-kazanma'],
  'yatirim-taktikleri': ['yatirim-taktikleri'],
}

const FALLBACK_SYSTEM = `Sen deneyimli bir haber editörüsün.
Viral olacak, yüksek trafik çekecek haberleri seçmekte uzmansın.
Türk okuyucunun ilgisini çekecek haberleri önceliklendirirsin.`

const FALLBACK_USER = `Aşağıdaki {{count}} haberi analiz et.
KATEGORİ: {{category}}
HABERLER:
{{news_list}}
SADECE JSON döndür: {"selected": [1, 2], "scores": {"1": 8, "2": 9}}`

export class ScoutAgent extends BaseAgent {
  slug = 'scout'
  name = 'Scout Ajanı'
  role = 'scout'
  order = 1
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    const category = input.category
    const subKeys = CATEGORY_SOURCE_MAP[category] || [category]

    const mergedRss: string[] = []
    const mergedReddit: string[] = []
    const mergedYoutube: string[] = []
    const mergedNewsapi: string[] = []

    for (const key of subKeys) {
      const src = SOURCES[key]
      if (!src) continue
      mergedRss.push(...(src.rss || []))
      mergedReddit.push(...(src.reddit || []))
      mergedYoutube.push(...(src.youtube || []))
      mergedNewsapi.push(...(src.newsapi || []))
    }

    const noop = async () => {}

    const [rssItems, ytItems, redditItems, newsItems] = await Promise.all([
      collectRSS(mergedRss, noop),
      collectYouTube(mergedYoutube, noop),
      collectReddit(mergedReddit, noop),
      collectNewsAPI(mergedNewsapi, noop),
    ])

    const allRaw = [...rssItems, ...ytItems, ...redditItems, ...newsItems]

    const raw: NewsItem[] = allRaw.map((item) => ({
      title: item.title,
      summary: item.summary || '',
      url: item.url,
      source: item.source,
      date: item.publishedAt instanceof Date ? item.publishedAt.toISOString() : new Date().toISOString(),
      category,
    }))

    input.rawNews = raw

    if (raw.length === 0) {
      throw new Error('Haber kaynakları boş geldi, Scout durdu')
    }

    const newsList = raw
      .slice(0, 20)
      .map((n, i) => `${i + 1}. ${n.title} [${n.source}]`)
      .join('\n')

    // Use DB prompts with fallback
    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      count: String(Math.min(raw.length, 20)),
      category,
      news_list: newsList,
      site_name: 'Cyba',
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.3,
      maxTokens: this.config?.maxTokens ?? 1000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    let selected: NewsItem[] = []

    try {
      const parsed = JSON.parse(result.content) as { selected?: number[] }
      const indices = (parsed.selected || []).slice(0, 3)
      selected = indices.map((i) => raw[i - 1]).filter(Boolean)
    } catch {
      selected = raw.slice(0, 3)
    }

    if (selected.length === 0) selected = raw.slice(0, 3)

    input.selectedNews = selected
    console.log(`     📡 ${raw.length} haber toplandı → ${selected.length} seçildi`)

    return input
  }
}
