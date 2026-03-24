import { writeFile, unlink, readdir, stat, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true })
  } catch {
    // already exists
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  await ensureUploadsDir()

  let names: string[]
  try {
    names = await readdir(UPLOADS_DIR)
  } catch {
    return NextResponse.json([], { status: 200 })
  }

  const imageExtensions = /\.(jpe?g|png|webp|gif)$/i

  const fileEntries = await Promise.all(
    names
      .filter((name) => imageExtensions.test(name))
      .map(async (name) => {
        try {
          const filePath = path.join(UPLOADS_DIR, name)
          const fileStat = await stat(filePath)
          return {
            name,
            url: `/uploads/${name}`,
            size: fileStat.size,
            createdAt: fileStat.mtime.toISOString(),
          }
        } catch {
          return null
        }
      })
  )

  const files = fileEntries
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(files)
}

export async function POST(request: NextRequest) {
  await ensureUploadsDir()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Form verisi okunamadı' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Yalnızca JPEG, PNG, WebP ve GIF formatları desteklenir' },
      { status: 415 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Dosya boyutu 5MB sınırını aşıyor' },
      { status: 413 }
    )
  }

  const sanitized = sanitizeFilename(file.name)
  const filename = `${Date.now()}-${sanitized}`
  const filePath = path.join(UPLOADS_DIR, filename)

  try {
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))
  } catch {
    return NextResponse.json({ error: 'Dosya yazılamadı' }, { status: 500 })
  }

  return NextResponse.json(
    {
      name: filename,
      url: `/uploads/${filename}`,
      size: file.size,
      createdAt: new Date().toISOString(),
    },
    { status: 201 }
  )
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) {
    return NextResponse.json({ error: 'Dosya adı belirtilmedi' }, { status: 400 })
  }

  // Prevent path traversal
  const safeBasename = path.basename(name)
  if (safeBasename !== name || name.includes('..') || name.includes('/')) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  const filePath = path.join(UPLOADS_DIR, safeBasename)

  try {
    await unlink(filePath)
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Dosya silinemedi' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
