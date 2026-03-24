import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  const user = session?.user as { systemRole?: string; role?: string } | undefined
  if (!session) {
    redirect('/login')
  }
  if (user?.systemRole !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN') {
    redirect('/editor')
  }

  return <>{children}</>
}
