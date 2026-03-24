import path from 'path'
import fs from 'fs/promises'

// Category gradient configs
const CATEGORY_GRADIENTS: Record<string, { bg: string; accent: string; textColor: string }> = {
  finans:      { bg: '#1a0a00', accent: '#f7931a', textColor: '#fff7ed' },
  ekonomi:     { bg: '#001a3d', accent: '#3b82f6', textColor: '#eff6ff' },
  gayrimenkul: { bg: '#001a0d', accent: '#10b981', textColor: '#ecfdf5' },
  oyun:        { bg: '#1a0040', accent: '#a855f7', textColor: '#faf5ff' },
  teknoloji:   { bg: '#001a1a', accent: '#00c896', textColor: '#f0fdfa' },
  rehberler:   { bg: '#1a1400', accent: '#f59e0b', textColor: '#fffbeb' },
  // sub-categories fallback
  borsa:       { bg: '#1a0a00', accent: '#f7931a', textColor: '#fff7ed' },
  kripto:      { bg: '#0d0a1a', accent: '#8b5cf6', textColor: '#f5f3ff' },
  'altin-doviz': { bg: '#1a1400', accent: '#f59e0b', textColor: '#fffbeb' },
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 4) // max 4 lines
}

export async function generateCoverImage(
  title: string,
  category: string,
): Promise<string | null> {
  try {
    const sharp = (await import('sharp')).default
    const config = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.finans
    const accent = hexToRgb(config.accent)
    const bg = hexToRgb(config.bg)

    const W = 1200
    const H = 630

    // Build gradient SVG background
    const lines = wrapText(title, 38)
    const lineHeight = 64
    const totalTextH = lines.length * lineHeight
    const textY = (H - totalTextH) / 2

    const textLines = lines
      .map((line, i) => {
        const y = textY + i * lineHeight + 48
        return `<text
          x="600" y="${y}"
          font-family="Arial, sans-serif"
          font-size="48"
          font-weight="bold"
          fill="${config.textColor}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`
      })
      .join('\n')

    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(${bg.r},${bg.g},${bg.b});stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(${Math.min(bg.r + 20, 255)},${Math.min(bg.g + 20, 255)},${Math.min(bg.b + 20, 255)});stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent-line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgb(${accent.r},${accent.g},${accent.b});stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(${accent.r},${accent.g},${accent.b});stop-opacity:0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Accent corner glow -->
  <ellipse cx="${W}" cy="0" rx="400" ry="300"
    fill="rgb(${accent.r},${accent.g},${accent.b})" opacity="0.12" />
  <ellipse cx="0" cy="${H}" rx="300" ry="200"
    fill="rgb(${accent.r},${accent.g},${accent.b})" opacity="0.08" />

  <!-- Top accent line -->
  <rect x="0" y="0" width="${W}" height="6" fill="url(#accent-line)" />

  <!-- Category label -->
  <rect x="60" y="50" width="${categoryLabel.length * 16 + 32}" height="36" rx="8"
    fill="rgb(${accent.r},${accent.g},${accent.b})" opacity="0.9" />
  <text x="${60 + 16}" y="73"
    font-family="Arial, sans-serif" font-size="18" font-weight="bold"
    fill="${config.bg}" text-anchor="start">${categoryLabel.toUpperCase()}</text>

  <!-- Title -->
  ${textLines}

  <!-- Watermark -->
  <text x="${W - 40}" y="${H - 24}"
    font-family="Arial, sans-serif" font-size="20" font-weight="bold"
    fill="rgb(${accent.r},${accent.g},${accent.b})" text-anchor="end" opacity="0.7"
  >CYBA</text>

  <!-- Bottom accent line -->
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#accent-line)" />
</svg>`

    // Ensure output directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'auto')
    await fs.mkdir(uploadsDir, { recursive: true })

    const filename = `cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const outputPath = path.join(uploadsDir, filename)

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toFile(outputPath)

    return `/uploads/auto/${filename}`
  } catch (err) {
    console.error('⚠️ Görsel üretim hatası:', err instanceof Error ? err.message : err)
    return null
  }
}
