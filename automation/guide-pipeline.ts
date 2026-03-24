import { prisma } from '@/lib/db'
import type { PipelineData } from '@/types/pipeline'
import { GuideScoutAgent } from './agents/guide-scout-agent'
import { GuideWriterAgent } from './agents/guide-writer-agent'
import { GuideEditorAgent } from './agents/guide-editor-agent'
import { GuideSeoAgent } from './agents/guide-seo-agent'
import { MediaAgent } from './agents/media-agent'
import { GuidePublisherAgent } from './agents/guide-publisher-agent'
import type { BaseAgent } from './agents/base-agent'

export type PipelineLogFn = (message: string) => void | Promise<void>

export class GuidePipeline {
  private agents: BaseAgent[] = [
    new GuideScoutAgent(),
    new GuideWriterAgent(),
    new GuideEditorAgent(),
    new GuideSeoAgent(),
    new MediaAgent(),
    new GuidePublisherAgent(),
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

    const session = await prisma.automationSession.create({
      data: { category, status: 'running' },
    })

    await log(`\n📚 [Guide Pipeline] Başlatıldı: ${category.toUpperCase()}`)
    await log(`📋 Session: ${session.id}`)

    let data: PipelineData = {
      sessionId: session.id,
      category,
      rawNews: [],
      totalTokens: 0,
      totalCost: 0,
    }

    for (const agent of this.agents) {
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

    await log(`\n🎉 Guide Pipeline tamamlandı!`)
    if (data.published) {
      await log(`📝 Rehber: ${data.published.title}`)
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
