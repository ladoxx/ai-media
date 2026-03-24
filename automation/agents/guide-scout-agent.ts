import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'
import { collectRSS } from '../collectors/rss'
import { collectReddit } from '../collectors/reddit'
import { SOURCES } from '../config'

const GUIDE_CATEGORY_SOURCE_MAP: Record<string, string[]> = {
  'nasil-yapilir':      ['nasil-yapilir'],
  'para-kazanma':       ['para-kazanma'],
  'yatirim-taktikleri': ['yatirim-taktikleri'],
  rehberler:            ['nasil-yapilir', 'para-kazanma', 'yatirim-taktikleri'],
}

const FALLBACK_SYSTEM = `Sen SEO odaklı içerik stratejistisin.
Türk okuyucunun Google'da aradığı "nasıl yapılır" sorgularını çok iyi biliyorsun.
Yüksek arama hacimli, düşük rekabetli rehber konularını seçmekte uzmansın.`

const FALLBACK_USER = `Aşağıdaki {{count}} içerik başlığı/sorgusu var.
KATEGORİ: {{category}}

İÇERİKLER:
{{news_list}}

En iyi rehber konusu için analiz yap. Seçtiğin konu:
- Türkiye'de yüksek arama hacmine sahip olmalı
- Uzun kuyruklu anahtar kelime potansiyeli taşımalı
- Pratik, adım adım anlatılabilir olmalı
- Okuyucunun hayatına somut fayda sağlamalı

SADECE JSON döndür:
{
  "selected": [1],
  "topic": "Seçilen rehber konusu",
  "keywords": ["ana kelime", "uzun kuyruklu 1", "uzun kuyruklu 2"],
  "targetAudience": "Hedef kitle açıklaması",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedLength": 2000,
  "outline": ["Adım 1: ...", "Adım 2: ...", "Adım 3: ..."]
}`

export class GuideScoutAgent extends BaseAgent {
  slug = 'guide-scout'
  name = 'Guide Scout Ajanı'
  role = 'guide-scout'
  order = 1
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    const category = input.category
    const subKeys = GUIDE_CATEGORY_SOURCE_MAP[category] || ['nasil-yapilir']

    const mergedRss: string[] = []
    const mergedReddit: string[] = []

    for (const key of subKeys) {
      const src = SOURCES[key]
      if (!src) continue
      mergedRss.push(...(src.rss || []))
      mergedReddit.push(...(src.reddit || []))
    }

    const noop = async () => {}

    const [rssItems, redditItems] = await Promise.all([
      collectRSS(mergedRss, noop),
      collectReddit(mergedReddit, noop),
    ])

    const allRaw = [...rssItems, ...redditItems]

    if (allRaw.length === 0) {
      throw new Error('Rehber kaynakları boş geldi, Guide Scout durdu')
    }

    const newsList = allRaw
      .slice(0, 20)
      .map((n, i) => `${i + 1}. ${n.title} [${n.source}]`)
      .join('\n')

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      count: String(Math.min(allRaw.length, 20)),
      category,
      news_list: newsList,
      site_name: 'Cyba',
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.4,
      maxTokens: this.config?.maxTokens ?? 1500,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    let guideTopic: PipelineData['guideTopic']

    try {
      const parsed = JSON.parse(result.content) as {
        topic?: string
        keywords?: string[]
        targetAudience?: string
        difficulty?: string
        estimatedLength?: number
        outline?: string[]
        selected?: number[]
      }

      const selectedIdx = (parsed.selected || [1])[0] - 1
      const selectedItem = allRaw[selectedIdx] || allRaw[0]

      guideTopic = {
        topic: parsed.topic || selectedItem?.title || 'Rehber Konusu',
        keywords: parsed.keywords || [],
        targetAudience: parsed.targetAudience || 'Genel okuyucu',
        difficulty: (parsed.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        estimatedLength: parsed.estimatedLength || 2000,
        outline: parsed.outline || [],
        sourceUrl: selectedItem?.url || '',
        sourceTitle: selectedItem?.title || '',
      }
    } catch {
      const item = allRaw[0]
      guideTopic = {
        topic: item?.title || 'Rehber Konusu',
        keywords: [],
        targetAudience: 'Genel okuyucu',
        difficulty: 'beginner',
        estimatedLength: 2000,
        outline: [],
        sourceUrl: item?.url || '',
        sourceTitle: item?.title || '',
      }
    }

    input.guideTopic = guideTopic
    // Also populate rawNews for compatibility
    input.rawNews = allRaw.slice(0, 5).map((item) => ({
      title: item.title,
      summary: item.summary || '',
      url: item.url,
      source: item.source,
      date: item.publishedAt instanceof Date ? item.publishedAt.toISOString() : new Date().toISOString(),
      category,
    }))

    console.log(`     📡 ${allRaw.length} kaynak tarandı → konu seçildi: ${guideTopic.topic}`)

    return input
  }
}
