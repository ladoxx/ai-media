import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

const getPopularTags = unstable_cache(
  async () =>
    prisma.tag.findMany({
      orderBy: { postCount: 'desc' },
      take: 20,
      select: { id: true, name: true, slug: true, postCount: true },
    }),
  ['popular-tags'],
  { revalidate: 3600, tags: ['tags'] },
)

export async function GET() {
  const tags = await getPopularTags()
  return NextResponse.json(tags)
}
