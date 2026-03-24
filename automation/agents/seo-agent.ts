import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen SEO uzmanısın. Türkiye pazarına odaklanıyorsun.
Google'da üst sıralarda çıkmak için içerikleri optimize ediyorsun.`

const FALLBACK_USER = `Aşağıdaki makaleyi SEO optimize et.
BAŞLIK: {{title}}
KATEGORİ: {{category}}
İÇERİK:
{{content}}
SADECE JSON döndür: {"focusKeyword": "keyword", "seoTitle": "başlık", "seoDescription": "desc", "optimizedContent": "<p>içerik</p>", "tags": ["tag1"], "readTime": 4, "seoScore": 80}`

function estimateReadTime(content: string): number {
  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 200))
}

export class SeoAgent extends BaseAgent {
  slug = 'seo'
  name = 'SEO Ajanı'
  role = 'seo'
  order = 4
  isCritical = false

  async process(input: PipelineData): Promise<PipelineData> {
    const source = input.edited || (input.draft ? {
      title: input.draft.title,
      content: input.draft.content,
      excerpt: input.draft.excerpt,
    } : null)

    if (!source) throw new Error('SEO için içerik bulunamadı')

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      title: source.title,
      category: input.category,
      content: source.content.slice(0, 2000),
      excerpt: source.excerpt || '',
      site_name: 'Cyba',
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.3,
      maxTokens: this.config?.maxTokens ?? 2000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    try {
      const parsed = JSON.parse(result.content) as {
        focusKeyword?: string
        seoTitle?: string
        seoDescription?: string
        optimizedContent?: string
        tags?: string[]
        readTime?: number
        seoScore?: number
      }

      input.seo = {
        focusKeyword: String(parsed.focusKeyword || source.title.split(' ')[0]),
        seoTitle: String(parsed.seoTitle || source.title).slice(0, 70),
        seoDescription: String(parsed.seoDescription || source.excerpt).slice(0, 165),
        optimizedContent: String(parsed.optimizedContent || source.content),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 6) : [],
        readTime: parsed.readTime || estimateReadTime(source.content),
        seoScore: parsed.seoScore || 70,
      }

      console.log(`     🔍 SEO skoru: ${input.seo.seoScore}/100, anahtar: "${input.seo.focusKeyword}"`)
    } catch {
      input.seo = {
        focusKeyword: source.title.split(' ')[0],
        seoTitle: source.title.slice(0, 70),
        seoDescription: (source.excerpt || '').slice(0, 165),
        optimizedContent: source.content,
        tags: [],
        readTime: estimateReadTime(source.content),
        seoScore: 60,
      }
      console.log('     ⚠️  SEO parse hatası, varsayılan değerler kullanılıyor')
    }

    return input
  }
}
