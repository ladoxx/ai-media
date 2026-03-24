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
  const agent = await prisma.automationAgent.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, role: true,
      systemPrompt: true, userPromptTmpl: true, promptVersion: true,
      updatedAt: true,
    },
  })

  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })
  return NextResponse.json(agent)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { slug } = await params
  const body = await req.json() as {
    systemPrompt: string
    userPromptTmpl: string
    note?: string
  }

  const agent = await prisma.automationAgent.findUnique({ where: { slug } })
  if (!agent) return NextResponse.json({ error: 'Ajan bulunamadı' }, { status: 404 })

  const newVersion = (agent.promptVersion || 1) + 1

  // Save history entry for the *current* prompt before overwriting
  if (agent.systemPrompt || agent.userPromptTmpl) {
    await prisma.agentPromptHistory.create({
      data: {
        agentId: agent.id,
        systemPrompt: agent.systemPrompt || '',
        userPromptTmpl: agent.userPromptTmpl || '',
        version: agent.promptVersion || 1,
        note: null,
      },
    })
  }

  // Update with new prompt
  const updated = await prisma.automationAgent.update({
    where: { slug },
    data: {
      systemPrompt: body.systemPrompt,
      userPromptTmpl: body.userPromptTmpl,
      promptVersion: newVersion,
    },
    select: {
      id: true, slug: true, systemPrompt: true, userPromptTmpl: true,
      promptVersion: true, updatedAt: true,
    },
  })

  // Also save the new version to history for reference
  await prisma.agentPromptHistory.create({
    data: {
      agentId: agent.id,
      systemPrompt: body.systemPrompt,
      userPromptTmpl: body.userPromptTmpl,
      version: newVersion,
      note: body.note || null,
    },
  })

  return NextResponse.json(updated)
}
