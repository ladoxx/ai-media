import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const categories = await prisma.category.findMany({
    include: {
      children: {
        include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } },
        orderBy: { menuOrder: 'asc' },
      },
      _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
    },
    orderBy: { menuOrder: 'asc' },
  })

  return NextResponse.json({ categories })
}
