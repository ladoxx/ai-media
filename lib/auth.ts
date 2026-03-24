import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { calculatePermissions } from './permissions'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Aktif değilse giriş engellenir
        if (!user.active) {
          throw new Error('Hesabınız henüz onaylanmadı. SuperAdmin onayı bekleniyor.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          systemRole: user.systemRole,
          roleId: user.roleId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; systemRole: string; roleId?: string | null }
        token.id = u.id
        token.systemRole = u.systemRole
        token.roleId = u.roleId ?? null
        // Yetkileri hesapla ve token'a ekle
        token.permissions = await calculatePermissions(u.id)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as Record<string, unknown>
        u.id = token.id
        u.systemRole = token.systemRole
        u.roleId = token.roleId
        u.permissions = token.permissions
        // Geriye dönük uyumluluk için role de set et
        u.role = token.systemRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'EDITOR'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
