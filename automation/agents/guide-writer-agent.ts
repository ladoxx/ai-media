import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen Türkiye'nin en iyi "nasıl yapılır" rehber yazarısın.
Pratik, adım adım, okuyucunun hayatını kolaylaştıran içerikler yazıyorsun.

YAZIM STİLİ:
- Her adım net ve uygulanabilir olmalı
- Somut örnekler ver (TL cinsinden, Türk platformları, yerel bağlam)
- Jargon kullanma veya açıkla
- Doğrudan ve sade dil
- Madde listeleri ve numaralı adımlar kullan

FORMAT (mutlaka uygula):
1. Güçlü başlık (odak kelimeyi içersin)
2. Giriş (neden bu rehbere ihtiyaç duyulduğu, 2-3 cümle)
3. İçindekiler tablosu (h2 başlıklarına göre)
4. Her bölüm: H2 başlık + pratik içerik
5. Pro ipuçları kutusu (her bölümün sonuna)
6. SSS bölümü (en az 3 soru-cevap)
7. Sonuç + harekete geçirici mesaj

UZUNLUK: 1500-3000 kelime
HEDEF: Google "nasıl yapılır" sorgularında ilk sayfaya çıkmak`

const FALLBACK_USER = `Aşağıdaki konu için kapsamlı rehber yaz.

KONU: {{topic}}
KATEGORİ: {{category}}
HEDEF KİTLE: {{target_audience}}
ANAHTAR KELİMELER: {{keywords}}
ZORLUK SEVİYESİ: {{difficulty}}
TASLAK:
{{outline}}

Rehberde şunları mutlaka ekle:
- Affiliate link placeholder: uygun yerlere [AFFILIATE_LINK:platform_adi] ekle (örn: [AFFILIATE_LINK:paribu], [AFFILIATE_LINK:binance])
- Her adımda somut TL tutarları veya Türkçe platform isimleri
- FAQ bölümü (en az 3 soru)
- Pro tip kutuları

SADECE JSON döndür:
{
  "title": "Başlık (odak kelimeyi içersin)",
  "slug": "url-friendly-slug",
  "content": "<h2>...<\\/h2><p>...<\\/p>",
  "excerpt": "2 cümle, güçlü özet",
  "tocItems": ["Bölüm 1", "Bölüm 2"],
  "difficulty": "beginner",
  "estimatedReadTime": 8
}`

export class GuideWriterAgent extends BaseAgent {
  slug = 'guide-writer'
  name = 'Guide Writer Ajanı'
  role = 'guide-writer'
  order = 2
  isCritical = true

  async process(input: PipelineData): Promise<PipelineData> {
    const guideTopic = input.guideTopic
    if (!guideTopic) {
      throw new Error('Guide Scout çalışmadı, konu bilgisi eksik')
    }

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      topic: guideTopic.topic,
      category: input.category,
      target_audience: guideTopic.targetAudience,
      keywords: guideTopic.keywords.join(', '),
      difficulty: guideTopic.difficulty,
      outline: guideTopic.outline.join('\n'),
      estimated_length: String(guideTopic.estimatedLength),
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.7,
      maxTokens: this.config?.maxTokens ?? 5000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    try {
      const parsed = JSON.parse(result.content) as {
        title?: string
        slug?: string
        content?: string
        excerpt?: string
        tocItems?: string[]
        difficulty?: string
        estimatedReadTime?: number
      }

      input.guideDraft = {
        title: parsed.title || guideTopic.topic,
        slug: parsed.slug || guideTopic.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        content: parsed.content || '',
        excerpt: parsed.excerpt || '',
        tocItems: parsed.tocItems || [],
        difficulty: parsed.difficulty || guideTopic.difficulty,
        estimatedReadTime: parsed.estimatedReadTime || Math.ceil(guideTopic.estimatedLength / 200),
      }
    } catch {
      throw new Error('Guide Writer JSON parse hatası')
    }

    console.log(`     ✍️  Rehber yazıldı: ${input.guideDraft?.title}`)
    return input
  }
}
