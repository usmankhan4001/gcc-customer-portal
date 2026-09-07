import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup', '/demo', '/api/health']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth required
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // API routes — handled by API auth (JWT), pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected CRM/CMS/Admin and other routes — check session cookie
  const session = request.cookies.get('session')?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
