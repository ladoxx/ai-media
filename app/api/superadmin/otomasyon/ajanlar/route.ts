import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function isSuperAdmin() {
  const session = await getServerSession(authOptions)
  return (session?.user as { role?: string })?.role === 'SUPERADMIN'
}

export async function GET() {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const agents = await prisma.automationAgent.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true, name: true, slug: true, role: true, description: true,
      active: true, isCritical: true, platformSlug: true, model: true,
      temperature: true, maxTokens: true, timeout: true, maxRetry: true,
      order: true, systemPrompt: true, userPromptTmpl: true, promptVersion: true,
      lastRun: true, lastStatus: true, runCount: true, totalTokens: true, totalCost: true,
    },
  })

  return NextResponse.json(agents)
}

export async function PATCH(req: NextRequest) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json() as { slug: string; active?: boolean; model?: string; temperature?: number; maxTokens?: number }
  const { slug, ...data } = body

  const agent = await prisma.automationAgent.update({
    where: { slug },
    data,
  })

  return NextResponse.json(agent)
}
