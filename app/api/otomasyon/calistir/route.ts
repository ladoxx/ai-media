import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 800 // ~13 minutes max

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAuthorized(req: NextRequest, session: any): boolean {
  if (session && (session.user as { role?: string })?.role === 'SUPERADMIN') return true
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (token && token === process.env.AUTOMATION_SECRET) return true
  return false
}

async function setRunningState(running: boolean, category = '') {
  await prisma.setting.upsert({
    where: { key: 'automation_running' },
    update: { value: running ? category : 'false' },
    create: { key: 'automation_running', value: running ? category : 'false' },
  })
  if (running) {
    await prisma.setting.upsert({
      where: { key: 'automation_run_started' },
      update: { value: new Date().toISOString() },
      create: { key: 'automation_run_started', value: new Date().toISOString() },
    })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAuthorized(req, session)) {
    return new Response('Yetkisiz', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'all'

  const enabledSetting = await prisma.setting.findUnique({ where: { key: 'automation_enabled' } })
  if (enabledSetting?.value === 'false') {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Otomasyon devre dışı bırakıldı. Ayarlardan aktifleştirin.' })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const runningSetting = await prisma.setting.findUnique({ where: { key: 'automation_running' } })
  if (runningSetting && runningSetting.value !== 'false') {
    const startedSetting = await prisma.setting.findUnique({ where: { key: 'automation_run_started' } })
    const startedAt = startedSetting ? new Date(startedSetting.value).getTime() : 0
    const isStale = Date.now() - startedAt > 20 * 60 * 1000
    if (!isStale) {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', message: `Otomasyon zaten çalışıyor: ${runningSetting.value}. Lütfen bekleyin.` })}\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* stream may be closed */ }
      }

      send({ type: 'start', category })
      await setRunningState(true, category)

      try {
        const runnerPath = path.resolve(process.cwd(), 'automation', 'runner.ts')
        // tsx bin — shell:true lets Windows resolve tsx → tsx.cmd automatically
        const tsxBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx')

        // Quote paths to handle Windows paths with spaces
        const child = spawn(`"${tsxBin}"`, [`"${runnerPath}"`, category], {
          env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=4096',
          },
          cwd: process.cwd(),
          shell: true,
        })

        let buffer = ''

        child.stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const data = JSON.parse(trimmed) as object
              send(data)
            } catch { /* ignore non-JSON output */ }
          }
        })

        child.stderr.on('data', (chunk: Buffer) => {
          const text = chunk.toString().trim()
          // Filter out tsx/ts-node informational messages
          if (text && !text.startsWith('(node:') && !text.includes('ExperimentalWarning')) {
            send({ type: 'log', message: `⚠️ ${text}` })
          }
        })

        await new Promise<void>((resolve) => {
          child.on('close', (code) => {
            if (code !== 0 && code !== null) {
              send({ type: 'error', message: `Runner process beklenmedik şekilde kapandı (kod: ${code})` })
            }
            resolve()
          })
          child.on('error', (err) => {
            send({ type: 'error', message: `Spawn hatası: ${err.message}` })
            resolve()
          })
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        send({ type: 'error', message })
      } finally {
        await setRunningState(false)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
