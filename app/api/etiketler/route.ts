import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'

const getAllTags = unstable_cache(
  async () => prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, postCount: true } }),
  ['all-tags'],
  { revalidate: 3600, tags: ['tags'] },
)

export async function GET() {
  const tags = await getAllTags()
  return NextResponse.json(tags)
}
