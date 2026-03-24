import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

// Merge sourceId into targetId: move all posts from source to target, delete source
export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { sourceId, targetId } = await req.json()
  if (!sourceId || !targetId || sourceId === targetId) {
    return NextResponse.json({ error: 'Geçersiz etiket seçimi' }, { status: 400 })
  }

  // Posts that already have the target tag (skip to avoid @@id conflict)
  const alreadyHaveTarget = await prisma.postTag.findMany({ where: { tagId: targetId }, select: { postId: true } })
  const skipPostIds = new Set(alreadyHaveTarget.map((pt) => pt.postId))

  // Get all posts with source tag
  const sourcePosts = await prisma.postTag.findMany({ where: { tagId: sourceId }, select: { postId: true } })

  // Add target tag to posts that don't already have it
  const toAdd = sourcePosts.filter((pt) => !skipPostIds.has(pt.postId))
  if (toAdd.length) {
    await prisma.postTag.createMany({
      data: toAdd.map((pt) => ({ postId: pt.postId, tagId: targetId })),
    })
  }

  // Update target postCount
  const newCount = await prisma.postTag.count({ where: { tagId: targetId } })
  await prisma.tag.update({ where: { id: targetId }, data: { postCount: newCount } })

  // Delete source
  await prisma.postTag.deleteMany({ where: { tagId: sourceId } })
  await prisma.tag.delete({ where: { id: sourceId } })

  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, merged: toAdd.length })
}
