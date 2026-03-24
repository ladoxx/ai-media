import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen rehber içerikleri için SEO uzmanısın.
"Nasıl yapılır" sorgularında öne çıkan featured snippet optimizasyonunu çok iyi biliyorsun.

UZMANLIK ALANLARIN:
- HowTo schema markup
- FAQ schema markup
- Uzun kuyruklu anahtar kelime optimizasyonu
- Featured snippet odaklı yapı
- Türkçe arama motoru davranışları`

const FALLBACK_USER = `Aşağıdaki rehber içeriği için SEO optimizasyonu yap.

BAŞLIK: {{title}}
KATEGORİ: {{category}}
ODAK KELİMELER: {{keywords}}
İÇERİK:
{{content}}

HowTo schema için adımları ve FAQ schema için soruları içerikten çıkar.

SADECE JSON döndür:
{
  "focusKeyword": "ana odak kelime",
  "seoTitle": "SEO başlık max 60 karakter",
  "seoDescription": "Meta açıklama max 155 karakter, tıklanabilir",
  "optimizedContent": "<h2>...<\\/h2><p>...<\\/p>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readTime": 8,
  "howToSchema": {
    "name": "Rehber başlığı",
    "description": "Kısa açıklama",
    "steps": [
      {"name": "Adım 1", "text": "Adım açıklaması"},
      {"name": "Adım 2", "text": "Adım açıklaması"}
    ]
  },
  "faqSchema": {
    "questions": [
      {"question": "Soru 1?", "answer": "Yanıt 1"},
      {"question": "Soru 2?", "answer": "Yanıt 2"}
    ]
  }
}`

export class GuideSeoAgent extends BaseAgent {
  slug = 'guide-seo'
  name = 'Guide SEO Ajanı'
  role = 'guide-seo'
  order = 4
  isCritical = false

  async process(input: PipelineData): Promise<PipelineData> {
    const draft = input.guideDraft
    const edited = input.guideEdited
    const topic = input.guideTopic

    if (!draft) {
      throw new Error('Guide Draft eksik')
    }

    const content = edited?.content || draft.content

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      title: draft.title,
      category: input.category,
      keywords: topic?.keywords.join(', ') || '',
      content: content.slice(0, 4000), // limit to avoid token overflow
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.3,
      maxTokens: this.config?.maxTokens ?? 3000,
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
        howToSchema?: object
        faqSchema?: object
      }

      input.guideSeo = {
        focusKeyword: parsed.focusKeyword || topic?.keywords[0] || '',
        seoTitle: parsed.seoTitle || draft.title,
        seoDescription: parsed.seoDescription || draft.excerpt,
        optimizedContent: parsed.optimizedContent || content,
        tags: parsed.tags || topic?.keywords || [],
        readTime: parsed.readTime || draft.estimatedReadTime || 8,
        howToSchema: parsed.howToSchema || {},
        faqSchema: parsed.faqSchema || {},
      }
    } catch {
      input.guideSeo = {
        focusKeyword: topic?.keywords[0] || '',
        seoTitle: draft.title,
        seoDescription: draft.excerpt,
        optimizedContent: content,
        tags: topic?.keywords || [],
        readTime: draft.estimatedReadTime || 8,
        howToSchema: {},
        faqSchema: {},
      }
    }

    console.log(`     💰 Guide SEO tamamlandı: ${input.guideSeo.focusKeyword}`)
    return input
  }
}
