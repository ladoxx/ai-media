import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PageRenderer } from '@/components/page-templates/PageRenderer'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret || token !== previewSecret) notFound()

  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) notFound()

  return (
    <div>
      {/* Preview banner */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/40 py-2 px-4 text-center">
        <span className="text-yellow-400 text-sm font-medium">
          👁 Önizleme Modu — Bu sayfa henüz yayında değil
        </span>
      </div>
      <PageRenderer page={{ ...page, status: 'PUBLISHED' }} />
    </div>
  )
}
