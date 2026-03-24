import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comment = await prisma.comment.update({
    where: { id },
    data: { likes: { increment: 1 } },
    select: { likes: true },
  })
  return NextResponse.json({ likes: comment.likes })
}
