import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebarWrapper } from '@/components/admin/AdminSidebarWrapper'
import { AdminProviders } from './providers'
import { ToastProvider } from '@/components/ui/Toast'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = {
    name: session.user.name ?? 'Kullanıcı',
    email: session.user.email ?? '',
    role: (session.user as { role?: string }).role ?? 'EDITOR',
  }

  return (
    <AdminProviders session={session}>
      <ToastProvider>
        <AdminSidebarWrapper user={user}>
          {children}
        </AdminSidebarWrapper>
      </ToastProvider>
    </AdminProviders>
  )
}
