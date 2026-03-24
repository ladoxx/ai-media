import { prisma } from '@/lib/db'
import type { PipelineData } from '@/types/pipeline'
import { ScoutAgent } from './agents/scout-agent'
import { WriterAgent } from './agents/writer-agent'
import { EditorAgent } from './agents/editor-agent'
import { SeoAgent } from './agents/seo-agent'
import { MediaAgent } from './agents/media-agent'
import { PublisherAgent } from './agents/publisher-agent'
import type { BaseAgent } from './agents/base-agent'

export type PipelineLogFn = (message: string) => void | Promise<void>

export class AutomationPipeline {
  private agents: BaseAgent[] = [
    new ScoutAgent(),
    new WriterAgent(),
    new EditorAgent(),
    new SeoAgent(),
    new MediaAgent(),
    new PublisherAgent(),
  ]

  async run(category: string, logFn?: PipelineLogFn): Promise<{
    success: boolean
    published?: { postId: string; url: string; title: string }
    totalTokens: number
    totalCost: number
    error?: string
  }> {
    const log = async (msg: string) => {
      console.log(msg)
      if (logFn) await logFn(msg)
    }

    // Create session
    const session = await prisma.automationSession.create({
      data: { category, status: 'running' },
    })

    await log(`\n🚀 [Multi-Agent] Pipeline başlatıldı: ${category.toUpperCase()}`)
    await log(`📋 Session: ${session.id}`)

    let data: PipelineData = {
      sessionId: session.id,
      category,
      rawNews: [],
      totalTokens: 0,
      totalCost: 0,
    }

    for (const agent of this.agents) {
      // Check if agent is active in DB
      const config = await prisma.automationAgent.findUnique({
        where: { slug: agent.slug },
      })

      if (!config?.active) {
        await log(`⏭️  ${agent.name} devre dışı, atlanıyor`)
        continue
      }

      await log(`  ▶ ${agent.name} çalışıyor...`)
      const result = await agent.run(data, session.id)

      if (result.success) {
        data = result.data
        await log(`  ✅ ${agent.name}: ${result.tokens} token, $${result.cost.toFixed(5)}, ${result.duration}ms`)
      } else {
        if (agent.isCritical) {
          await prisma.automationSession.update({
            where: { id: session.id },
            data: {
              status: 'error',
              finishedAt: new Date(),
              error: result.error,
              totalTokens: data.totalTokens,
              totalCost: data.totalCost,
            },
          })
          await log(`\n💥 Kritik ajan hata verdi, pipeline durdu: ${result.error}`)
          return {
            success: false,
            totalTokens: data.totalTokens,
            totalCost: data.totalCost,
            error: result.error,
          }
        }

        await log(`  ⚠️  ${agent.name} hata (kritik değil, devam): ${result.error}`)
      }
    }

    // Session completed
    await prisma.automationSession.update({
      where: { id: session.id },
      data: {
        status: 'success',
        finishedAt: new Date(),
        totalPosts: data.published ? 1 : 0,
        totalTokens: data.totalTokens,
        totalCost: data.totalCost,
      },
    })

    await log(`\n🎉 Pipeline tamamlandı!`)
    if (data.published) {
      await log(`📝 Yazı: ${data.published.title}`)
      await log(`🔗 URL: ${data.published.url}`)
    }
    await log(`💰 Maliyet: $${data.totalCost.toFixed(5)}`)
    await log(`🔤 Token: ${data.totalTokens}`)

    return {
      success: true,
      published: data.published,
      totalTokens: data.totalTokens,
      totalCost: data.totalCost,
    }
  }
}
