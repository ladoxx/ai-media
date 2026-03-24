import { prisma } from './db'

interface CommentInput {
  content: string
  ip?: string
  honeypot?: string   // should always be empty
}

interface SpamResult {
  isSpam: boolean
  reason?: string
}

async function getBannedWords(): Promise<string[]> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'comment_banned_words' } })
    if (!s?.value) return defaultBannedWords()
    return s.value.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean)
  } catch {
    return defaultBannedWords()
  }
}

function defaultBannedWords(): string[] {
  return ['spam', 'casino', 'bahis', 'kumar', 'porn', 'sex', 'hack', 'phishing', 'crypto giveaway']
}

async function getIpLimit(): Promise<number> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'comment_ip_limit' } })
    return s?.value ? parseInt(s.value, 10) : 5
  } catch {
    return 5
  }
}

export async function checkSpam(input: CommentInput): Promise<SpamResult> {
  // 1. Honeypot field must be empty
  if (input.honeypot && input.honeypot.trim() !== '') {
    return { isSpam: true, reason: 'honeypot' }
  }

  // 2. IP rate limit (X per hour)
  if (input.ip) {
    const limit = await getIpLimit()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.comment.count({
      where: { ip: input.ip, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= limit) {
      return { isSpam: true, reason: 'rate_limit' }
    }
  }

  // 3. Banned words
  const banned = await getBannedWords()
  const lower = input.content.toLowerCase()
  const foundWord = banned.find((w) => lower.includes(w))
  if (foundWord) {
    return { isSpam: true, reason: `banned_word:${foundWord}` }
  }

  // 4. Too many links (3+)
  const linkCount = (input.content.match(/https?:\/\//g) ?? []).length
  if (linkCount >= 3) {
    return { isSpam: true, reason: 'too_many_links' }
  }

  return { isSpam: false }
}
