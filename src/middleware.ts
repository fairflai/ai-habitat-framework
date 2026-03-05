export const runtime = 'nodejs'

import { auth } from '@/lib/auth'
import { verifyAdminTokenFromCookie } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function handleAdminRoutes(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public admin routes (no auth required)
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  // Verify admin-token cookie
  const cookieHeader = req.headers.get('cookie')
  const adminSession = await verifyAdminTokenFromCookie(cookieHeader)

  if (!adminSession) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }
    // Page routes redirect to admin login
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl.origin))
  }

  return NextResponse.next()
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  // Admin routes use separate auth (admin-token cookie, not NextAuth)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return handleAdminRoutes(req)
  }

  const isLoggedIn = !!req.auth

  // Public user routes
  const publicRoutes = ['/login', '/logout', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Unauthenticated on protected route → redirect to login
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated on /login → redirect to home
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
