import sharp from 'sharp'

const CATEGORY_COLORS: Record<string, string> = {
  finans:      '#f7931a',
  borsa:       '#f7931a',
  kripto:      '#8b5cf6',
  'altin-doviz': '#f59e0b',
  ekonomi:     '#3b82f6',
  gayrimenkul: '#10b981',
  oyun:        '#a855f7',
  teknoloji:   '#00c896',
  rehberler:   '#f59e0b',
}

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  finans:      ['#1a0a00', '#f7931a'],
  borsa:       ['#1a0a00', '#f7931a'],
  kripto:      ['#0d0a1a', '#8b5cf6'],
  'altin-doviz': ['#1a1400', '#f59e0b'],
  ekonomi:     ['#001a3d', '#3b82f6'],
  gayrimenkul: ['#001a0d', '#10b981'],
  oyun:        ['#1a0040', '#a855f7'],
  teknoloji:   ['#001a1a', '#00c896'],
  rehberler:   ['#1a1400', '#f59e0b'],
}

const CATEGORY_ICONS: Record<string, string> = {
  finans: '💰', borsa: '📈', kripto: '₿', 'altin-doviz': '🥇',
  ekonomi: '📊', gayrimenkul: '🏡', oyun: '🎮', teknoloji: '🤖',
  rehberler: '🧠',
}

export async function processImage(
  imageBuffer: Buffer,
  options: {
    category: string
    watermarkText?: string
  },
): Promise<Buffer> {
  const mainCategory = options.category.split('/')[0]
  const color = CATEGORY_COLORS[mainCategory] || '#00c896'
  const siteName = options.watermarkText || 'Para Pusulası'

  const watermarkSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="transparent" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grad)"/>
  <rect x="0" y="0" width="5" height="630" fill="${color}"/>
  <rect x="930" y="578" width="258" height="38" fill="rgba(0,0,0,0.65)" rx="5"/>
  <text x="1059" y="602" font-family="Arial,sans-serif" font-size="15" fill="white" text-anchor="middle" font-weight="bold" letter-spacing="0.5">${escapeXml(siteName)}</text>
</svg>`

  return sharp(imageBuffer)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer()
}

export async function generateGradientCover(title: string, category: string, watermarkText = 'Para Pusulası'): Promise<Buffer> {
  const mainCategory = category.split('/')[0]
  const [from, to] = CATEGORY_GRADIENTS[mainCategory] || ['#0d0d14', '#00c896']
  const icon = CATEGORY_ICONS[mainCategory] || '📰'

  const lines = wrapText(title, 38)
  const lineHeight = 52
  const totalTextHeight = lines.length * lineHeight
  const textStartY = Math.round((630 - totalTextHeight) / 2) + 20

  const textElements = lines.map((line, i) =>
    `<text x="600" y="${textStartY + i * lineHeight}" font-family="Arial,sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold" opacity="0.92">${escapeXml(line)}</text>`
  ).join('\n  ')

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#overlay)"/>
  <rect x="0" y="0" width="5" height="630" fill="${to}"/>
  <text x="600" y="${textStartY - 90}" font-size="110" text-anchor="middle" opacity="0.12">${icon}</text>
  ${textElements}
  <rect x="930" y="578" width="258" height="38" fill="rgba(0,0,0,0.45)" rx="5"/>
  <text x="1059" y="602" font-family="Arial,sans-serif" font-size="15" fill="white" text-anchor="middle" font-weight="bold" letter-spacing="0.5">${escapeXml(watermarkText)}</text>
</svg>`

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3) // max 3 lines
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
