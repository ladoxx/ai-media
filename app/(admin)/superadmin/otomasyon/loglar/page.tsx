import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LogsTable } from './LogsTable'

export default async function OtomasyonLoglarPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPERADMIN') redirect('/login')

  const logs = await prisma.autoLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Otomasyon Logları</h1>
        <p className="text-xs text-[#606080] mt-1">Son 100 log kaydı</p>
      </div>
      <LogsTable logs={logs} />
    </div>
  )
}
