import type { PipelineData, AgentResult } from '@/types/pipeline'
import { getAdapter } from '@/lib/ai-adapters'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import type { DeepSeekAdapter } from '@/lib/ai-adapters/deepseek'

export abstract class BaseAgent {
  abstract slug: string
  abstract name: string
  abstract role: string
  abstract order: number
  abstract isCritical: boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected adapter!: DeepSeekAdapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected config!: any

  async initialize() {
    this.config = await prisma.automationAgent.findUnique({
      where: { slug: this.slug },
    })

    if (!this.config) {
      throw new Error(`Ajan bulunamadı: ${this.slug}`)
    }

    const platform = await prisma.aiPlatform.findFirst({
      where: { slug: this.config.platformSlug, active: true },
    })

    if (!platform) {
      // Fallback: try any active platform
      const any = await prisma.aiPlatform.findFirst({ where: { active: true } })
      if (!any) throw new Error(`Aktif AI platform bulunamadı (${this.config.platformSlug})`)
      const apiKey = decrypt(any.apiKey)
      this.adapter = getAdapter(any.slug, apiKey)
      return
    }

    const apiKey = decrypt(platform.apiKey)
    this.adapter = getAdapter(this.config.platformSlug, apiKey)
  }

  abstract process(input: PipelineData): Promise<PipelineData>

  async run(input: PipelineData, sessionId: string): Promise<AgentResult> {
    const start = Date.now()

    try {
      await this.initialize()

      console.log(`  ▶ ${this.name} başladı...`)
      const output = await this.process(input)
      const duration = Date.now() - start
      const tokensUsed = output.totalTokens - input.totalTokens
      const costUsed = output.totalCost - input.totalCost

      await prisma.automationAgentLog.create({
        data: {
          agentId: this.config.id,
          sessionId,
          status: 'success',
          message: 'Başarıyla tamamlandı',
          tokens: tokensUsed,
          cost: costUsed,
          duration,
        },
      })

      await prisma.automationAgent.update({
        where: { slug: this.slug },
        data: {
          lastRun: new Date(),
          lastStatus: 'success',
          runCount: { increment: 1 },
          totalTokens: { increment: tokensUsed },
          totalCost: { increment: costUsed },
        },
      })

      console.log(`  ✅ ${this.name} tamamlandı (${duration}ms)`)

      return { success: true, data: output, tokens: tokensUsed, cost: costUsed, duration }
    } catch (error: unknown) {
      const duration = Date.now() - start
      const msg = error instanceof Error ? error.message : String(error)

      if (this.config?.id) {
        await prisma.automationAgentLog.create({
          data: {
            agentId: this.config.id,
            sessionId,
            status: 'error',
            message: msg,
            duration,
          },
        }).catch(() => {})

        await prisma.automationAgent.update({
          where: { slug: this.slug },
          data: { lastRun: new Date(), lastStatus: 'error' },
        }).catch(() => {})
      }

      console.log(`  ❌ ${this.name} hata: ${msg}`)

      return { success: false, data: input, tokens: 0, cost: 0, duration, error: msg }
    }
  }
}
