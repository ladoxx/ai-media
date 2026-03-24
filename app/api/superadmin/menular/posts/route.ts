import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const take = parseInt(req.nextUrl.searchParams.get('take') ?? '30')
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take,
    select: { id: true, title: true, slug: true, category: { select: { slug: true } } },
  })
  return NextResponse.json(posts)
}
