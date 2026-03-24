import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const revisions = await prisma.pageRevision.findMany({
    where: { pageId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(revisions)
}

// POST: restore a revision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const { revisionId } = await req.json() as { revisionId: string }

  const revision = await prisma.pageRevision.findFirst({ where: { id: revisionId, pageId: id } })
  if (!revision) return NextResponse.json({ error: 'Revizyon bulunamadı' }, { status: 404 })

  const page = await prisma.page.update({
    where: { id },
    data: { title: revision.title, content: revision.content },
  })

  // Create a new revision for the restore
  await prisma.pageRevision.create({
    data: {
      pageId: id,
      title: revision.title,
      content: revision.content,
      createdBy: `${(session.user as { email?: string }).email ?? 'superadmin'} (geri yükleme)`,
    },
  })

  return NextResponse.json(page)
}
