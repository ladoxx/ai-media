import crypto from 'crypto'

export function getGravatarUrl(email: string, size = 48): string {
  const hash = crypto
    .createHash('md5')
    .update(email.trim().toLowerCase())
    .digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=g`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

// Deterministic color from name for fallback avatar
export function getAvatarColor(name: string): string {
  const colors = [
    '#00c896', '#f7931a', '#3b82f6', '#a855f7',
    '#ef4444', '#eab308', '#06b6d4', '#ec4899',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
