import path from 'path'
import fs from 'fs/promises'

export interface PexelsImage {
  localPath: string
  keyword: string
  alt: string
}

interface PexelsPhoto {
  src: { large2x: string; large: string; medium: string }
  alt: string
}

interface PexelsResponse {
  photos: PexelsPhoto[]
  total_results: number
}

export async function fetchAndSavePexelsImage(keyword: string): Promise<PexelsImage | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&orientation=landscape&size=medium&per_page=1`
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    })

    if (!res.ok) {
      console.log(`     ⚠️  Pexels API hata (${keyword}): ${res.status}`)
      return null
    }

    const data = (await res.json()) as PexelsResponse

    if (!data.photos || data.photos.length === 0) {
      console.log(`     ℹ️  Pexels sonuç yok: ${keyword}`)
      return null
    }

    const photo = data.photos[0]
    const imageUrl = photo.src.large || photo.src.medium
    const alt = photo.alt || keyword

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.log(`     ⚠️  Pexels görsel indirilemedi: ${keyword}`)
      return null
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'auto')
    await fs.mkdir(uploadDir, { recursive: true })

    const rand6 = Math.random().toString(36).slice(2, 8)
    const filename = `inline-${Date.now()}-${rand6}.jpg`
    await fs.writeFile(path.join(uploadDir, filename), buffer)

    const localPath = `/uploads/auto/${filename}`
    console.log(`     🖼️  Pexels görsel kaydedildi (${keyword}): ${localPath}`)

    return { localPath, keyword, alt }
  } catch (err) {
    console.log(`     ⚠️  Pexels hata (${keyword}): ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

export async function fetchInlineImages(keywords: string[], max = 3): Promise<PexelsImage[]> {
  if (!process.env.PEXELS_API_KEY) return []

  const results: PexelsImage[] = []
  const limited = keywords.slice(0, max)

  for (const keyword of limited) {
    const img = await fetchAndSavePexelsImage(keyword)
    if (img) results.push(img)
  }

  return results
}
