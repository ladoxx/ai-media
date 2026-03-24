import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name parametresi eksik' }, { status: 400 })

  // Prevent path traversal
  const safeName = path.basename(name)
  if (!safeName.endsWith('.db') && !safeName.endsWith('.sqlite')) {
    return NextResponse.json({ error: 'Geçersiz dosya' }, { status: 400 })
  }

  const filePath = path.join(BACKUP_DIR, safeName)

  try {
    const content = await readFile(filePath)
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(content.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }
}
