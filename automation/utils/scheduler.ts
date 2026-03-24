/**
 * Standalone scheduler process.
 * Run with: npx tsx automation/utils/scheduler.ts
 * Or: pm2 start automation/utils/scheduler.ts
 */
import 'dotenv/config'
import cron from 'node-cron'
import { runAutomation } from '../index'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || ''

async function fetchSchedule(): Promise<{ sabah: string; oglen: string; aksam: string }> {
  try {
    const res = await fetch(`${APP_URL}/api/otomasyon/durum`, {
      headers: { Authorization: `Bearer ${AUTOMATION_SECRET}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { schedule?: { sabah: string; oglen: string; aksam: string } }
    return data.schedule || { sabah: '08:00', oglen: '13:00', aksam: '18:00' }
  } catch {
    return { sabah: '08:00', oglen: '13:00', aksam: '18:00' }
  }
}

async function start() {
  const schedule = await fetchSchedule()

  function toCron(time: string, category: string) {
    const [h, m] = time.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return null
    return { h, m, category }
  }

  const jobs = [
    toCron(schedule.sabah, 'all'),
    toCron(schedule.oglen, 'kripto'),
    toCron(schedule.aksam, 'all'),
  ].filter(Boolean) as { h: number; m: number; category: string }[]

  console.log('🕐 Zamanlayıcı başlatıldı:')
  for (const job of jobs) {
    const expr = `${job.m} ${job.h} * * *`
    console.log(`  - ${job.h.toString().padStart(2, '0')}:${job.m.toString().padStart(2, '0')} → ${job.category}`)
    cron.schedule(expr, () => {
      console.log(`\n⏰ Zamanlanmış çalışma: ${job.category}`)
      runAutomation(job.category).catch(console.error)
    })
  }

  console.log('✅ Zamanlayıcı aktif (Ctrl+C ile durdur)')
}

start().catch(console.error)
