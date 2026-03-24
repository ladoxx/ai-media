import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen deneyimli bir Türk gazetecisisin.
Türk okuyucular için akıcı, ilgi çekici makaleler yazıyorsun.`

const FALLBACK_USER = `Aşağıdaki haberi kullanarak makale yaz.
Başlık: {{title}}
Özet: {{summary}}
Kaynak: {{source}}
Kategori: {{category}}
SADECE JSON döndür: {"title": "başlık", "slug": "slug", "content": "<p>içerik</p>", "excerpt": "özet"}`

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 80)
}

export class WriterAgent extends BaseAgent {
  slug = 'writer'
  name = 'Writer Ajanı'
  role = 'writer'
  order = 2
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    const news = input.selectedNews?.length ? input.selectedNews : input.rawNews.slice(0, 3)
    if (news.length === 0) throw new Error('Writer için haber bulunamadı')

    // Use the highest-scored item as primary, others as context
    const primary = news[0]

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      title: primary.title,
      summary: primary.summary || 'Detay yok',
      source: primary.source,
      date: primary.date,
      category: input.category,
      site_name: 'Cyba',
      // Extra context from other selected items
      news_list: news.map((n, i) => `${i + 1}. ${n.title} (${n.source})`).join('\n'),
      count: String(news.length),
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.8,
      maxTokens: this.config?.maxTokens ?? 3000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    const parsed = JSON.parse(result.content) as {
      title?: string
      slug?: string
      excerpt?: string
      content?: string
    }

    if (!parsed.title || !parsed.content) {
      throw new Error('Writer geçersiz JSON döndürdü: title veya content eksik')
    }

    input.draft = {
      title: String(parsed.title).trim().slice(0, 120),
      slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.title!),
      content: String(parsed.content),
      excerpt: String(parsed.excerpt || '').trim().slice(0, 200),
    }

    console.log(`     ✍️  Makale yazıldı: "${input.draft.title}"`)
    return input
  }
}
