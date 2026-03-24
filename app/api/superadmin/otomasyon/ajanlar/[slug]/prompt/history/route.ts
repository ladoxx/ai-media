import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function isSuperAdmin() {
  const session = await getServerSession(authOptions)
  return (session?.user as { role?: string })?.role === 'SUPERADMIN'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { slug } = await params
  const agent = await prisma.automationAgent.findUnique({ where: { slug } })
  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })

  const history = await prisma.agentPromptHistory.findMany({
    where: { agentId: agent.id },
    orderBy: { version: 'desc' },
    select: {
      id: true, version: true, note: true, createdAt: true,
      systemPrompt: true, userPromptTmpl: true,
    },
  })

  return NextResponse.json(history)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { slug } = await params
  const body = await req.json() as { historyId: string }

  const agent = await prisma.automationAgent.findUnique({ where: { slug } })
  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })

  const entry = await prisma.agentPromptHistory.findUnique({ where: { id: body.historyId } })
  if (!entry || entry.agentId !== agent.id) {
    return NextResponse.json({ error: 'Geçmiş kaydı bulunamadı' }, { status: 404 })
  }

  // Save current as history first
  if (agent.systemPrompt || agent.userPromptTmpl) {
    await prisma.agentPromptHistory.create({
      data: {
        agentId: agent.id,
        systemPrompt: agent.systemPrompt || '',
        userPromptTmpl: agent.userPromptTmpl || '',
        version: agent.promptVersion || 1,
        note: 'Geri alma öncesi otomatik yedek',
      },
    })
  }

  // Restore
  const newVersion = (agent.promptVersion || 1) + 1
  const updated = await prisma.automationAgent.update({
    where: { slug },
    data: {
      systemPrompt: entry.systemPrompt,
      userPromptTmpl: entry.userPromptTmpl,
      promptVersion: newVersion,
    },
  })

  return NextResponse.json({ success: true, promptVersion: updated.promptVersion })
}
