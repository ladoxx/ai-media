export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getCategoryColor(color: string): string {
  const colors: Record<string, string> = {
    tech: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    crypto: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    real: 'bg-green-500/10 text-green-400 border-green-500/20',
    game: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return colors[color] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getCategoryGlow(color: string): string {
  const glows: Record<string, string> = {
    tech: 'shadow-blue-500/20',
    crypto: 'shadow-orange-500/20',
    real: 'shadow-green-500/20',
    game: 'shadow-purple-500/20',
  }
  return glows[color] || 'shadow-gray-500/20'
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}
