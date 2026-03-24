import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, readFile, mkdir } from 'fs/promises'
import path from 'path'

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

const BACKUP_DIR = path.join(process.cwd(), 'backups')
const DB_PATH = path.join(process.cwd(), 'dev.db')

export async function GET() {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    await mkdir(BACKUP_DIR, { recursive: true })
    const files = await readdir(BACKUP_DIR)
    const backups = await Promise.all(
      files
        .filter((f) => f.endsWith('.db') || f.endsWith('.sqlite'))
        .map(async (name) => {
          const fileStat = await stat(path.join(BACKUP_DIR, name))
          return {
            name,
            size: fileStat.size,
            createdAt: fileStat.birthtime.toISOString(),
            url: `/api/superadmin/yedek/download?name=${encodeURIComponent(name)}`,
          }
        })
    )
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ backups: backups.slice(0, 10) })
  } catch {
    return NextResponse.json({ backups: [] })
  }
}

export async function POST() {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

  try {
    await mkdir(BACKUP_DIR, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupName = `dev-backup-${timestamp}.db`
    const backupPath = path.join(BACKUP_DIR, backupName)

    const dbContent = await readFile(DB_PATH)
    const { writeFile } = await import('fs/promises')
    await writeFile(backupPath, dbContent)

    const fileStat = await stat(backupPath)

    return NextResponse.json({
      name: backupName,
      size: fileStat.size,
      url: `/api/superadmin/yedek/download?name=${encodeURIComponent(backupName)}`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
