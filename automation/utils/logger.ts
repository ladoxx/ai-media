import type { LogFn } from '../types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || ''

function timestamp(): string {
  return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Creates a logger that:
 * 1. Logs to console with timestamp
 * 2. Calls the optional local callback (for SSE streaming)
 * 3. POSTs to the Next.js API (for standalone/scheduler runs)
 */
export function createLogger(onLog?: LogFn, sendToApi = false): LogFn {
  return async (message: string) => {
    const formatted = `[${timestamp()}] ${message}`
    console.log(formatted)

    // Call local callback (used by SSE endpoint)
    if (onLog) {
      await onLog(formatted)
    }

    // Fire-and-forget to Next.js API (used by standalone scheduler)
    if (sendToApi && AUTOMATION_SECRET) {
      fetch(`${APP_URL}/api/otomasyon/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTOMATION_SECRET}`,
        },
        body: JSON.stringify({ message: formatted }),
      }).catch(() => {})
    }
  }
}

export function consoleLogger(): LogFn {
  return createLogger(undefined, false)
}
