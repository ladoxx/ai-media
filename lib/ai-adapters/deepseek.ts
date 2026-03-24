import OpenAI from 'openai'

export class DeepSeekAdapter {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    })
  }

  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      jsonMode?: boolean
    },
  ): Promise<{
    content: string
    tokens: number
    cost: number
    duration: number
  }> {
    const start = Date.now()

    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      response_format: options?.jsonMode ? { type: 'json_object' } : { type: 'text' },
    })

    const content = response.choices[0].message.content || ''
    const tokens = response.usage?.total_tokens || 0
    const cost = (tokens / 1_000_000) * 0.27
    const duration = Date.now() - start

    return { content, tokens, cost, duration }
  }
}
