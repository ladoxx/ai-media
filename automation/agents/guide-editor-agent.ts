import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen deneyimli bir Türk içerik editörüsün. Uzmanlık alanın rehber içerikleri.
Görevin: AI tarafından yazılan rehberleri, gerçek bir uzmanın kaleme aldığı doğal içeriğe dönüştürmek.

YAPILACAKLAR:
1. AI kalıplarını temizle ("Bu kapsamlı rehberde...", "Unutulmamalıdır ki...")
2. Pro tip kutularını zenginleştir — gerçek, uygulanabilir ipuçları ekle
3. Uyarı/dikkat kutularını (⚠️) uygun yerlere ekle
4. FAQ sorularını daha spesifik ve arama odaklı hale getir
5. Türkçe akışını düzelt, doğal dil kullan
6. Adımların mantık sırasını kontrol et

DOKUNMA:
- Affiliate link placeholderlarını ([AFFILIATE_LINK:x]) kaldırma
- Mevcut HTML yapısını bozma
- Sayısal verileri değiştirme`

const FALLBACK_USER = `Aşağıdaki rehber içeriğini düzelt ve zenginleştir.

BAŞLIK: {{title}}
KATEGORİ: {{category}}

İÇERİK:
{{content}}

SADECE JSON döndür:
{
  "content": "<h2>...<\\/h2><p>...<\\/p>",
  "excerpt": "Düzeltilmiş özet (2 cümle)",
  "tocItems": ["Bölüm 1", "Bölüm 2"]
}`

export class GuideEditorAgent extends BaseAgent {
  slug = 'guide-editor'
  name = 'Guide Editor Ajanı'
  role = 'guide-editor'
  order = 3
  isCritical = false

  async process(input: PipelineData): Promise<PipelineData> {
    const draft = input.guideDraft
    if (!draft) {
      throw new Error('Guide Writer çalışmadı, taslak eksik')
    }

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      title: draft.title,
      category: input.category,
      content: draft.content,
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.5,
      maxTokens: this.config?.maxTokens ?? 5000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    try {
      const parsed = JSON.parse(result.content) as {
        content?: string
        excerpt?: string
        tocItems?: string[]
      }

      input.guideEdited = {
        content: parsed.content || draft.content,
        excerpt: parsed.excerpt || draft.excerpt,
        tocItems: parsed.tocItems || draft.tocItems,
      }
    } catch {
      // Fall back to draft if parse fails
      input.guideEdited = {
        content: draft.content,
        excerpt: draft.excerpt,
        tocItems: draft.tocItems,
      }
    }

    console.log(`     🧠 Rehber düzenlendi`)
    return input
  }
}
