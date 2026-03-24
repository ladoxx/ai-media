import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { name?: string; systemRole?: string; permissions?: string[] } | undefined

  if (!session || !user) redirect('/login')

  const perms: string[] = user.permissions ?? []
  const has = (key: string) => perms.includes('*') || perms.includes(key)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Paneli</h1>
        <p className="text-sm text-[#606080] mt-1">Hoş geldiniz, {user.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {has('content:view') && (
          <a href="/admin/yazilar" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium text-white">Yazılar</div>
          </a>
        )}
        {has('automation:view') && (
          <a href="/admin/otomasyon" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium text-white">Otomasyon</div>
          </a>
        )}
        {has('ads:view') && (
          <a href="/admin/reklamlar" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">📣</div>
            <div className="text-sm font-medium text-white">Reklamlar</div>
          </a>
        )}
        {has('revenue:view') && (
          <a href="/admin/gelir" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium text-white">Gelir Takibi</div>
          </a>
        )}
        {has('newsletter:view') && (
          <a href="/admin/newsletter" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">📧</div>
            <div className="text-sm font-medium text-white">Newsletter</div>
          </a>
        )}
        {has('user:view') && (
          <a href="/admin/kullanicilar" className="bg-[#16162a] border border-[#1e1e35] rounded-xl p-5 hover:border-[#f7931a]/40 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium text-white">Kullanıcılar</div>
          </a>
        )}
      </div>
    </div>
  )
}
