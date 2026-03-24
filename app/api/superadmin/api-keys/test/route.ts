import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  if ((session.user as { role?: string }).role !== 'SUPERADMIN') return null
  return session
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getDecryptedKey(name: string): Promise<string | null> {
  const record = await prisma.apiKey.findUnique({ where: { name } })
  if (!record?.value) return null
  return decrypt(record.value)
}

function ms(start: number): string {
  return `${Date.now() - start}ms`
}

// ─── Service testers ──────────────────────────────────────────────────────────
async function testGemini(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Anahtar tanımlı değil' }
  // Lightweight: just validate key exists (no network call to avoid quota)
  return { ok: true, message: 'Anahtar mevcut (bağlantı testi yapılmadı — kota koruma)' }
}

async function testYouTube(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Anahtar tanımlı değil' }
  return { ok: true, message: 'Anahtar mevcut (bağlantı testi yapılmadı — kota koruma)' }
}

async function testTelegram(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: 'Token tanımlı değil' }
  const start = Date.now()
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      return {
        ok: true,
        message: `Bağlantı başarılı — Bot: @${data.result?.username ?? 'bilinmiyor'} (${ms(start)})`,
      }
    }
    return {
      ok: false,
      message: `Telegram hatası: ${data.description ?? 'Bilinmeyen hata'} (${ms(start)})`,
    }
  } catch (e) {
    return { ok: false, message: `Bağlantı hatası: ${e instanceof Error ? e.message : 'timeout'}` }
  }
}

async function testNewsAPI(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Anahtar tanımlı değil' }
  const start = Date.now()
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${key}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    if (res.ok && data.status === 'ok') {
      return {
        ok: true,
        message: `Bağlantı başarılı — ${data.totalResults ?? '?'} sonuç mevcut (${ms(start)})`,
      }
    }
    return {
      ok: false,
      message: `NewsAPI hatası: ${data.message ?? data.code ?? 'Bilinmeyen hata'} (${ms(start)})`,
    }
  } catch (e) {
    return { ok: false, message: `Bağlantı hatası: ${e instanceof Error ? e.message : 'timeout'}` }
  }
}

async function testReddit(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Anahtar tanımlı değil' }
  return { ok: true, message: 'Anahtar mevcut (tam test için REDDIT_SECRET de gereklidir)' }
}

async function testSMTP(key: string, field: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: `${field} tanımlı değil` }
  return { ok: true, message: `${field} ayarlı (canlı SMTP testi için bağlantı gerekli)` }
}

async function testGA(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'GA ID tanımlı değil' }
  if (!key.startsWith('G-') && !key.startsWith('UA-')) {
    return { ok: false, message: 'Geçersiz GA ID formatı (G-XXXXXX veya UA-XXXXX bekleniyor)' }
  }
  return { ok: true, message: `GA ID geçerli format: ${key}` }
}

// ─── POST /api/superadmin/api-keys/test ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  let body: { service?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const { service } = body
  if (!service || typeof service !== 'string') {
    return NextResponse.json({ error: 'service zorunludur' }, { status: 400 })
  }

  const keyValue = await getDecryptedKey(service)
  const value = keyValue ?? ''

  let result: { ok: boolean; message: string }

  switch (service) {
    case 'GEMINI_API_KEY':
      result = await testGemini(value)
      break
    case 'YOUTUBE_API_KEY':
      result = await testYouTube(value)
      break
    case 'TELEGRAM_TOKEN':
      result = await testTelegram(value)
      break
    case 'NEWSAPI_KEY':
      result = await testNewsAPI(value)
      break
    case 'REDDIT_CLIENT_ID':
      result = await testReddit(value)
      break
    case 'REDDIT_SECRET':
      result = value
        ? { ok: true, message: 'Reddit Secret mevcut' }
        : { ok: false, message: 'Reddit Secret tanımlı değil' }
      break
    case 'SMTP_HOST':
      result = await testSMTP(value, 'SMTP Host')
      break
    case 'SMTP_USER':
      result = await testSMTP(value, 'SMTP Kullanıcı')
      break
    case 'SMTP_PASS':
      result = await testSMTP(value, 'SMTP Şifre')
      break
    case 'GA_ID':
      result = await testGA(value)
      break
    default:
      result = value
        ? { ok: true, message: 'Anahtar mevcut' }
        : { ok: false, message: 'Anahtar tanımlı değil' }
  }

  // Log the test
  try {
    await prisma.autoLog.create({
      data: {
        type: 'API_KEY_TEST',
        status: result.ok ? 'success' : 'error',
        message: `Test: ${service} — ${result.message}`,
      },
    })
  } catch {
    // ignore
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 200 }) // always 200, ok flag carries result
}
