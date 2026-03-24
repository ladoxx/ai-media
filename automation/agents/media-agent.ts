import path from 'path'
import fs from 'fs/promises'
import { BaseAgent } from './base-agent'
import type { PipelineData } from '@/types/pipeline'
import { CloudflareWorkerClient } from '@/lib/cloudflare-worker'
import { buildImagePrompt } from '@/lib/image-prompt-builder'
import { processImage, generateGradientCover } from '@/lib/image-processor'

function deriveImageKeywords(input: PipelineData): string[] {
  const tags = input.guideSeo?.tags || input.seo?.tags || []
  if (tags.length > 0) return [...new Set(tags)].slice(0, 3)

  const focusKw = input.guideSeo?.focusKeyword || input.seo?.focusKeyword || ''
  if (focusKw) {
    const words = focusKw.split(/\s+/).filter((w) => w.length >= 4)
    if (words.length > 0) return [...new Set(words)].slice(0, 3)
  }

  const title =
    input.seo?.seoTitle ||
    input.guideSeo?.seoTitle ||
    input.edited?.title ||
    input.guideDraft?.title ||
    input.draft?.title ||
    ''
  const words = title.split(/\s+/).filter((w) => w.length >= 4)
  return [...new Set(words)].slice(0, 3)
}

export class MediaAgent extends BaseAgent {
  slug = 'media'
  name = 'Media Ajanı'
  role = 'media'
  order = 5
  isCritical = false

  async process(input: PipelineData): Promise<PipelineData> {
    const title =
      input.seo?.seoTitle ||
      input.guideSeo?.seoTitle ||
      input.edited?.title ||
      input.guideDraft?.title ||
      input.draft?.title ||
      'Haber'

    const category = input.category
    const slugBase = input.draft?.slug || input.guideDraft?.slug || `post-${Date.now()}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'auto')
    await fs.mkdir(uploadDir, { recursive: true })

    const workerUrl = process.env.CF_WORKER_URL || ''
    const secretKey = process.env.CF_SECRET_KEY || ''
    const watermarkText = process.env.WATERMARK_TEXT || 'Para Pusulası'

    if (!workerUrl || !secretKey) {
      throw new Error('CF_WORKER_URL veya CF_SECRET_KEY .env.local içinde tanımlı değil')
    }

    const client = new CloudflareWorkerClient({ workerUrl, secretKey })

    try {
      // 1. Prompt üret
      console.log('     🎨 Görsel prompt üretiliyor...')
      const imagePrompt = await buildImagePrompt(title, category)
      console.log(`     📝 Prompt: ${imagePrompt.slice(0, 70)}...`)

      // 2. Cloudflare Flux ile görsel üret
      console.log('     ☁️  Flux görsel üretiliyor...')
      const rawImage = await client.generateImage({
        prompt: imagePrompt,
        width: 1200,
        height: 624,
      })

      if (!rawImage || rawImage.length < 1000) {
        throw new Error(`Geçersiz görsel verisi (${rawImage?.length ?? 0} byte)`)
      }

      // 3. Watermark ekle
      console.log('     💧 Watermark ekleniyor...')
      const processedImage = await processImage(rawImage, {
        category,
        watermarkText,
      })

      // 4. Kaydet
      const filename = `${slugBase.slice(0, 60)}-${Date.now()}.jpg`
      await fs.writeFile(path.join(uploadDir, filename), processedImage)

      const imageUrl = `/uploads/auto/${filename}`
      console.log(`     ✅ AI görsel kaydedildi: ${imageUrl}`)

      const result: PipelineData = {
        ...input,
        media: {
          coverPath: imageUrl,
          ogPath: imageUrl,
        },
      }

      // Fetch inline images from Pexels if API key is set
      if (process.env.PEXELS_API_KEY) {
        const keywords = deriveImageKeywords(input)
        if (keywords.length > 0) {
          const { fetchInlineImages } = await import('@/automation/collectors/images')
          const inlineImages = await fetchInlineImages(keywords, 3)
          if (inlineImages.length > 0) {
            result.media = { ...result.media!, inlineImages }
          }
        }
      }

      return result
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.log(`     ⚠️  AI görsel hata: ${msg}`)
      console.log('     🎨 Gradient fallback kullanılıyor...')

      try {
        const fallbackImage = await generateGradientCover(title, category, watermarkText)
        const filename = `${slugBase.slice(0, 60)}-fallback-${Date.now()}.jpg`
        await fs.writeFile(path.join(uploadDir, filename), fallbackImage)

        const fallbackUrl = `/uploads/auto/${filename}`
        console.log(`     🖼️  Fallback görsel kaydedildi: ${fallbackUrl}`)

        const fallbackResult: PipelineData = {
          ...input,
          media: {
            coverPath: fallbackUrl,
            ogPath: fallbackUrl,
          },
        }

        if (process.env.PEXELS_API_KEY) {
          const keywords = deriveImageKeywords(input)
          if (keywords.length > 0) {
            const { fetchInlineImages } = await import('@/automation/collectors/images')
            const inlineImages = await fetchInlineImages(keywords, 3)
            if (inlineImages.length > 0) {
              fallbackResult.media = { ...fallbackResult.media!, inlineImages }
            }
          }
        }

        return fallbackResult
      } catch (fallbackErr: unknown) {
        const fMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        console.log(`     ❌ Fallback da hata verdi: ${fMsg}`)
        return input
      }
    }
  }
}
