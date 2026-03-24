import { NextRequest, NextResponse } from 'next/server'
import { getMenuFresh } from '@/lib/menus'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ location: string }> }) {
  const { location } = await params
  const items = await getMenuFresh(location)
  return NextResponse.json(items, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
