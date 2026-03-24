import type { PexelsImage } from '../collectors/images'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildFigure(img: PexelsImage): string {
  const cap = img.keyword.charAt(0).toUpperCase() + img.keyword.slice(1)
  return `<figure class="article-image"><img src="${img.localPath}" alt="${escapeHtml(img.alt)}" width="1200" height="600" loading="lazy" /><figcaption>${escapeHtml(cap)}</figcaption></figure>`
}

export function injectInlineImages(html: string, images: PexelsImage[]): string {
  if (!images || images.length === 0) return html

  // Split on H2 boundaries (keep the <h2 tag at start of each segment after first)
  const segments = html.split(/(?=<h2[\s>])/gi)

  if (segments.length <= 1) {
    // No H2 tags — append all images at the end
    return html + images.map(buildFigure).join('')
  }

  // Insert first image after the intro (segments[0])
  const result: string[] = []
  result.push(segments[0])
  if (images[0]) result.push(buildFigure(images[0]))

  for (let i = 1; i < segments.length; i++) {
    result.push(segments[i])
    // Insert an image after every other H2 section
    if (i % 2 === 0) {
      const imgIdx = Math.floor(i / 2)
      if (images[imgIdx]) result.push(buildFigure(images[imgIdx]))
    }
  }

  return result.join('')
}
