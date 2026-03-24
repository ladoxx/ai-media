import sharp from 'sharp'
import path from 'path'
import { mkdir } from 'fs/promises'
import { CATEGORY_META } from '../config'
import type { LogFn } from '../types'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'auto')
const WIDTH = 1200
const HEIGHT = 630

function wrapText(text: string, maxLineLength: number, maxLines: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLineLength) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
    if (lines.length >= maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  return lines.slice(0, maxLines)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function generateCoverImage(
  title: string,
  category: string,
  log: LogFn = console.log,
): Promise<string | null> {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true })

    const meta = CATEGORY_META[category] || {
      label: category.toUpperCase(),
      color: ['#0a0a14', '#606080'] as [string, string],
    }

    const [colorStart, colorEnd] = meta.color
    const categoryLabel = meta.label

    // Wrap title into 2 lines, 45 chars each
    const lines = wrapText(title, 45, 2)
    const titleFontSize = lines.join(' ').length > 60 ? 42 : 50

    const textY1 = 490
    const textY2 = textY1 + titleFontSize + 14

    const titleLines = lines
      .map((line, i) => {
        const y = i === 0 ? textY1 : textY2
        return `<text x="60" y="${y}" font-family="Arial, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="white" letter-spacing="-0.5">${escapeXml(line)}</text>`
      })
      .join('\n')

    const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorEnd};stop-opacity:0.85" />
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:0" />
      <stop offset="65%" style="stop-color:#000000;stop-opacity:0.75" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Grid pattern -->
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" stroke-width="0.3" opacity="0.08"/>
  </pattern>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />

  <!-- Bottom overlay for text readability -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlay)" />

  <!-- Category badge -->
  <rect x="60" y="60" width="${categoryLabel.length * 14 + 40}" height="40" rx="8" fill="${colorEnd}" opacity="0.9"/>
  <text x="80" y="85" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" letter-spacing="2">${escapeXml(categoryLabel)}</text>

  <!-- Title lines -->
  ${titleLines}

  <!-- Site watermark -->
  <text x="${WIDTH - 40}" y="${HEIGHT - 30}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" opacity="0.6" text-anchor="end">Cyba</text>

  <!-- Accent line -->
  <rect x="60" y="${textY1 - 24}" width="6" height="${lines.length > 1 ? titleFontSize * 2 + 20 : titleFontSize + 10}" rx="3" fill="${colorEnd}"/>
</svg>`

    const filename = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    const filepath = path.join(UPLOADS_DIR, filename)

    await sharp(Buffer.from(svg))
      .png({ quality: 90 })
      .toFile(filepath)

    const publicUrl = `/uploads/auto/${filename}`
    await log(`🖼️ Kapak görseli oluşturuldu: ${publicUrl}`)
    return publicUrl
  } catch (err) {
    await log(`⚠️ Görsel oluşturma hatası: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}
