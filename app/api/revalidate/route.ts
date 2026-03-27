import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.AUTOMATION_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  // Revalidate root layout → cascades to all pages
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true })
}
