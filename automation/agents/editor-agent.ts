import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { buildPrompt } from '@/lib/prompt-builder'

const FALLBACK_SYSTEM = `Sen titiz bir Türk editörüsün.
AI tarafından yazılmış makaleleri insan yazısına dönüştürüyorsun.`

const FALLBACK_USER = `Aşağıdaki makaleyi düzelt.
MAKALE:
{{content}}
SADECE JSON döndür: {"content": "<p>düzeltilmiş</p>", "excerpt": "özet", "changes": ["değişiklik"]}`

export class EditorAgent extends BaseAgent {
  slug = 'editor'
  name = 'Editor Ajanı'
  role = 'editor'
  order = 3
  isCritical = false

  async process(input: PipelineData): Promise<PipelineData> {
    if (!input.draft) throw new Error('Editor için draft bulunamadı')

    const systemPrompt = this.config?.systemPrompt || FALLBACK_SYSTEM
    const userTemplate = this.config?.userPromptTmpl || FALLBACK_USER
    const userPrompt = buildPrompt(userTemplate, {
      content: input.draft.content,
      title: input.draft.title,
      excerpt: input.draft.excerpt,
      category: input.category,
      site_name: 'Cyba',
    })

    const result = await this.adapter.generate(systemPrompt, userPrompt, {
      temperature: this.config?.temperature ?? 0.6,
      maxTokens: this.config?.maxTokens ?? 3000,
      jsonMode: true,
    })

    input.totalTokens += result.tokens
    input.totalCost += result.cost

    try {
      const parsed = JSON.parse(result.content) as {
        content?: string
        excerpt?: string
        changes?: string[]
      }

      if (parsed.content) {
        input.edited = {
          title: input.draft.title,
          content: String(parsed.content),
          excerpt: String(parsed.excerpt || input.draft.excerpt).trim().slice(0, 200),
          changes: Array.isArray(parsed.changes) ? parsed.changes.map(String) : [],
        }
        console.log(`     ✏️  ${input.edited.changes.length} düzenleme yapıldı`)
      } else {
        throw new Error('content boş')
      }
    } catch {
      input.edited = {
        title: input.draft.title,
        content: input.draft.content,
        excerpt: input.draft.excerpt,
        changes: [],
      }
      console.log('     ⚠️  Editor parse hatası, draft kullanılıyor')
    }

    return input
  }
}
