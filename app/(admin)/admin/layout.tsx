import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebarWrapper } from '@/components/admin/AdminSidebarWrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  const user = session?.user as {
    systemRole?: string
    role?: string
    name?: string
    email?: string
    permissions?: string[]
  } | undefined

  if (!session || !user) redirect('/login')

  const role = user.systemRole ?? user.role ?? 'EDITOR'

  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/editor')
  }

  return (
    <AdminSidebarWrapper
      user={{
        name: user.name ?? '',
        email: user.email ?? '',
        role,
        permissions: user.permissions ?? [],
      }}
    >
      {children}
    </AdminSidebarWrapper>
  )
}
