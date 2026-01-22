export const runtime = 'nodejs'

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public routes che non richiedono autenticazione
  const publicRoutes = ['/login', '/logout', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Se non autenticato e su route protetta, redirect a login
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se autenticato e su /login, redirect alla home
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin))
  }

  // Protezione routes /admin - solo per utenti con ruolo admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const userRole = req.auth?.user?.role

    if (userRole !== 'admin') {
      // Se non admin, redirect a pagina principale con messaggio
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/?error=forbidden', req.nextUrl.origin))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Matcher che esclude file statici e API auth
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
