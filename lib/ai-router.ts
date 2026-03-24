import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'

export interface AiResult {
  content: string
  tokens: number
  duration: number
  cost: number
  platformId: string
  platformName: string
  model: string
}

// ── Adapters ────────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, model: string, prompt: string): Promise<{ content: string; tokens: number }> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({ model })
  const result = await genModel.generateContent(prompt)
  const response = result.response
  const text = response.text()
  const tokens = response.usageMetadata?.totalTokenCount ?? Math.ceil(text.length / 4)
  return { content: text, tokens }
}

async function callOpenRouter(apiKey: string, model: string, prompt: string, baseUrl?: string): Promise<{ content: string; tokens: number }> {
  const url = `${baseUrl ?? 'https://openrouter.ai/api/v1'}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    signal: AbortSignal.timeout(180000), // 180s — ücretsiz modeller yavaş olabilir
  })
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after') ?? res.headers.get('x-ratelimit-reset-requests')
      const wait = retryAfter ? ` (${retryAfter}s sonra tekrar dene)` : ''
      throw new Error(`OpenRouter hız limiti aşıldı (429)${wait}. Farklı bir model seçin veya bekleyin.`)
    }
    throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
  }
  const data = await res.json() as { choices: Array<{ message: { content: string } }>; usage?: { total_tokens: number } }
  return {
    content: data.choices[0]?.message?.content ?? '',
    tokens: data.usage?.total_tokens ?? 0,
  }
}

async function callHuggingFace(apiKey: string, model: string, prompt: string): Promise<{ content: string; tokens: number }> {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false } }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`)
  const data = await res.json() as Array<{ generated_text: string }> | { generated_text: string }
  const content = Array.isArray(data) ? (data[0]?.generated_text ?? '') : (data.generated_text ?? '')
  return { content, tokens: Math.ceil(content.length / 4) }
}

async function callGroq(apiKey: string, model: string, prompt: string): Promise<{ content: string; tokens: number }> {
  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
  })
  return {
    content: completion.choices[0]?.message?.content ?? '',
    tokens: completion.usage?.total_tokens ?? 0,
  }
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<{ content: string; tokens: number }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })
  const content = message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  return {
    content,
    tokens: (message.usage.input_tokens ?? 0) + (message.usage.output_tokens ?? 0),
  }
}

async function callOpenAI(apiKey: string, model: string, prompt: string, baseUrl?: string): Promise<{ content: string; tokens: number }> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) })
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
  })
  return {
    content: completion.choices[0]?.message?.content ?? '',
    tokens: completion.usage?.total_tokens ?? 0,
  }
}

async function callDeepSeek(apiKey: string, model: string, prompt: string): Promise<{ content: string; tokens: number }> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
  })
  return {
    content: completion.choices[0]?.message?.content ?? '',
    tokens: completion.usage?.total_tokens ?? 0,
  }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

async function callPlatform(
  slug: string,
  apiKey: string,
  model: string,
  prompt: string,
  baseUrl?: string | null,
): Promise<{ content: string; tokens: number }> {
  switch (slug) {
    case 'gemini':      return callGemini(apiKey, model, prompt)
    case 'openrouter':  return callOpenRouter(apiKey, model, prompt, baseUrl ?? undefined)
    case 'huggingface': return callHuggingFace(apiKey, model, prompt)
    case 'groq':        return callGroq(apiKey, model, prompt)
    case 'deepseek':    return callDeepSeek(apiKey, model, prompt)
    case 'anthropic':   return callAnthropic(apiKey, model, prompt)
    case 'openai':      return callOpenAI(apiKey, model, prompt, baseUrl ?? undefined)
    default:            throw new Error(`Bilinmeyen platform: ${slug}`)
  }
}

// ── Simple cost estimation (USD per 1M tokens) ───────────────────────────────
const COST_PER_1M: Record<string, number> = {
  gemini: 0.075,
  openrouter: 0.1,
  huggingface: 0,
  groq: 0,
  anthropic: 3,
  openai: 0.6,
  deepseek: 0.27,
}

function estimateCost(slug: string, tokens: number): number {
  return ((COST_PER_1M[slug] ?? 0) * tokens) / 1_000_000
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateContent(prompt: string): Promise<AiResult> {
  // Load primary platform
  const primary = await prisma.aiPlatform.findFirst({
    where: { isPrimary: true, active: true },
  })

  const backup = await prisma.aiPlatform.findFirst({
    where: { isBackup: true, active: true, id: { not: primary?.id } },
  })

  const platforms = [primary, backup].filter(Boolean) as NonNullable<typeof primary>[]

  if (platforms.length === 0) {
    throw new Error('Aktif AI platformu bulunamadı. Lütfen SuperAdmin panelinden bir platform etkinleştirin.')
  }

  let lastError: Error | null = null

  for (const platform of platforms) {
    const start = Date.now()
    const decryptedKey = decrypt(platform.apiKey)

    try {
      const { content, tokens } = await callPlatform(
        platform.slug,
        decryptedKey,
        platform.model,
        prompt,
        platform.baseUrl,
      )
      const duration = Date.now() - start
      const cost = estimateCost(platform.slug, tokens)

      // Log + update usage
      await Promise.all([
        prisma.aiLog.create({
          data: {
            platformId: platform.id,
            tokens,
            cost,
            prompt: prompt.slice(0, 500),
            response: content.slice(0, 1000),
            duration,
            success: true,
          },
        }),
        prisma.aiPlatform.update({
          where: { id: platform.id },
          data: { usedTokens: { increment: tokens } },
        }),
      ])

      return { content, tokens, duration, cost, platformId: platform.id, platformName: platform.name, model: platform.model }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const duration = Date.now() - start

      await prisma.aiLog.create({
        data: {
          platformId: platform.id,
          tokens: 0,
          cost: 0,
          prompt: prompt.slice(0, 500),
          response: lastError.message,
          duration,
          success: false,
        },
      }).catch(() => {})
    }
  }

  throw lastError ?? new Error('Tüm AI platformları başarısız oldu')
}

export async function testPlatform(
  platformId: string,
  prompt = 'Merhaba! Türkçe 2 cümleyle kendini tanıt.',
): Promise<{ success: boolean; content: string; tokens: number; duration: number; error?: string }> {
  const platform = await prisma.aiPlatform.findUnique({ where: { id: platformId } })
  if (!platform) return { success: false, content: '', tokens: 0, duration: 0, error: 'Platform bulunamadı' }

  const start = Date.now()
  const decryptedKey = decrypt(platform.apiKey)

  try {
    const { content, tokens } = await callPlatform(
      platform.slug,
      decryptedKey,
      platform.model,
      prompt,
      platform.baseUrl,
    )
    const duration = Date.now() - start

    await prisma.aiPlatform.update({
      where: { id: platformId },
      data: { lastTested: new Date(), testStatus: 'success' },
    })

    return { success: true, content, tokens, duration }
  } catch (err) {
    const duration = Date.now() - start
    const error = err instanceof Error ? err.message : String(err)

    await prisma.aiPlatform.update({
      where: { id: platformId },
      data: { lastTested: new Date(), testStatus: 'error' },
    })

    return { success: false, content: '', tokens: 0, duration, error }
  }
}
