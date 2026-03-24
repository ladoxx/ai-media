import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Route → gerekli izin haritası (ADMIN paneli için)
const ROUTE_PERMISSIONS: Array<{ pattern: RegExp; module: string; action: string }> = [
  { pattern: /^\/admin\/otomasyon/, module: 'automation', action: 'view' },
  { pattern: /^\/admin\/reklamlar/, module: 'ads',        action: 'view' },
  { pattern: /^\/admin\/gelir/,     module: 'revenue',    action: 'view' },
  { pattern: /^\/admin\/kullanicilar/, module: 'user',    action: 'view' },
  { pattern: /^\/admin\/newsletter/, module: 'newsletter', action: 'view' },
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path  = req.nextUrl.pathname

    // /login: token yoksa göster, token varsa panele yönlendir
    if (path === '/login') {
      if (!token) return NextResponse.next()
      const role = (token.systemRole as string) ?? (token.role as string) ?? ''
      if (role === 'SUPERADMIN') return NextResponse.redirect(new URL('/superadmin', req.url))
      if (role === 'ADMIN')      return NextResponse.redirect(new URL('/admin', req.url))
      return NextResponse.redirect(new URL('/editor', req.url))
    }

    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const systemRole = (token.systemRole as string) ?? (token.role as string) ?? ''
    const permissions: string[] = (token.permissions as string[]) ?? []

    // /superadmin/* → sadece SUPERADMIN
    if (path.startsWith('/superadmin')) {
      if (systemRole !== 'SUPERADMIN') {
        return NextResponse.redirect(new URL('/editor', req.url))
      }
    }

    // /admin/* → ADMIN veya SUPERADMIN
    if (path.startsWith('/admin')) {
      if (systemRole !== 'ADMIN' && systemRole !== 'SUPERADMIN') {
        return NextResponse.redirect(new URL('/editor', req.url))
      }

      // Detaylı modül kontrolü (wildcard olanlar geçer)
      if (!permissions.includes('*')) {
        for (const rule of ROUTE_PERMISSIONS) {
          if (rule.pattern.test(path)) {
            const key = `${rule.module}:${rule.action}`
            if (!permissions.includes(key)) {
              return NextResponse.redirect(new URL('/admin', req.url))
            }
          }
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        if (path === '/login') return true
        if (
          path.startsWith('/editor') ||
          path.startsWith('/admin') ||
          path.startsWith('/superadmin')
        ) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/editor/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
    '/login',
  ],
}
