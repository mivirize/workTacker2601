import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/api/revalidate']
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route))

  // LP display routes (public)
  const isLpDisplayRoute = /^\/[^/]+\/[^/]+$/.test(nextUrl.pathname) &&
    !nextUrl.pathname.startsWith('/dashboard') &&
    !nextUrl.pathname.startsWith('/hearings') &&
    !nextUrl.pathname.startsWith('/lps')

  // Allow public routes and LP display routes
  if (isPublicRoute || isLpDisplayRoute || nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  // Handle API routes differently - return 401 JSON instead of redirect
  if (nextUrl.pathname.startsWith('/api/')) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated (for page routes)
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
