import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { getAdapter } from '@/lib/ai-adapters'
import { buildPrompt } from '@/lib/prompt-builder'

async function isSuperAdmin() {
  const session = await getServerSession(authOptions)
  return (session?.user as { role?: string })?.role === 'SUPERADMIN'
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { slug } = await params
  const body = await req.json() as {
    systemPrompt: string
    userPromptTmpl: string
    testData?: Record<string, string>
  }

  const agent = await prisma.automationAgent.findUnique({ where: { slug } })
  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })

  // Get AI platform
  const platform = await prisma.aiPlatform.findFirst({
    where: { slug: agent.platformSlug, active: true },
  }) || await prisma.aiPlatform.findFirst({ where: { active: true } })

  if (!platform) {
    return NextResponse.json({ error: 'Aktif AI platform bulunamadı' }, { status: 400 })
  }

  const adapter = getAdapter(platform.slug, decrypt(platform.apiKey))

  // Fill template with test data
  const testVars: Record<string, string> = {
    title: 'Bitcoin 70.000 dolar sınırını aştı',
    summary: 'BTC, kurumsal alımların etkisiyle yeni rekor kırdı.',
    source: 'coindesk.com',
    date: new Date().toISOString(),
    category: 'kripto',
    content: '<p>Test içerik paragrafı...</p>',
    count: '5',
    news_list: '1. Bitcoin 70k geçti\n2. ETH 3500 dolar\n3. SOL rekor kırdı',
    site_name: 'Cyba',
    ...(body.testData || {}),
  }

  const userPrompt = buildPrompt(body.userPromptTmpl, testVars)

  try {
    const result = await adapter.generate(body.systemPrompt, userPrompt, {
      temperature: agent.temperature,
      maxTokens: Math.min(agent.maxTokens, 1000), // cap for test
    })

    return NextResponse.json({
      content: result.content,
      tokens: result.tokens,
      cost: result.cost,
      duration: result.duration,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
