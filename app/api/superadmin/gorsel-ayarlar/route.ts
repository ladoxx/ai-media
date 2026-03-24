import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

const ENV_PATH = path.join(process.cwd(), '.env.local')

async function readEnvFile(): Promise<string> {
  try { return await fs.readFile(ENV_PATH, 'utf-8') }
  catch { return '' }
}

function getEnvValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].replace(/^["']|["']$/g, '') : ''
}

function setEnvValue(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  if (content.match(new RegExp(`^${key}=`, 'm'))) {
    return content.replace(new RegExp(`^${key}=.*$`, 'm'), line)
  }
  return content.trimEnd() + '\n' + line + '\n'
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  try {
    const content = await readEnvFile()
    const workerUrl = getEnvValue(content, 'CF_WORKER_URL')
    const secretKey = getEnvValue(content, 'CF_SECRET_KEY')
    const watermarkText = getEnvValue(content, 'WATERMARK_TEXT')
    return NextResponse.json({ workerUrl, secretKey, watermarkText })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  try {
    const body = await req.json() as { workerUrl?: string; secretKey?: string; watermarkText?: string }
    let content = await readEnvFile()
    if (body.workerUrl !== undefined) content = setEnvValue(content, 'CF_WORKER_URL', body.workerUrl)
    if (body.secretKey !== undefined) content = setEnvValue(content, 'CF_SECRET_KEY', body.secretKey)
    if (body.watermarkText !== undefined) content = setEnvValue(content, 'WATERMARK_TEXT', body.watermarkText)
    await fs.writeFile(ENV_PATH, content, 'utf-8')
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
