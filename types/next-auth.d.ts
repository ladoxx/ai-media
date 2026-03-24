import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      // Geriye dönük uyumluluk
      role: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'
      // Yeni RBAC alanları
      systemRole: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'
      roleId?: string | null
      permissions: string[]
    }
  }
  interface User {
    id: string
    systemRole: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'
    roleId?: string | null
    // Geriye dönük uyumluluk
    role?: 'EDITOR' | 'ADMIN' | 'SUPERADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    systemRole: string
    roleId?: string | null
    permissions: string[]
    // Geriye dönük uyumluluk
    role?: string
  }
}
