import { NextRequest, NextResponse } from 'next/server'
import { getWidgetsByArea } from '@/lib/widgets'

interface Params { params: Promise<{ area: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { area } = await params
  const widgets = await getWidgetsByArea(area)
  return NextResponse.json(widgets)
}
