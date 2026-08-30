import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gccstartup-dev-secret'
);

const PUBLIC_PATHS = [
  '/api/',
  '/_next/',
  '/icons/',
  '/favicon.ico',
  '/icon.png',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/vault/shared/', // token-authenticated shareable links — not session-gated
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Real authenticated routes — the `(authenticated)` route group plus
// `/checkout`, which requires login per plan Decision 5 (no guest checkout).
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/services',
  '/vault',
  '/profile',
  '/support',
  '/checkout',
  '/notifications',
  // NOTE: /onboarding is intentionally NOT protected — it IS the registration
  // page and must be accessible to unauthenticated users.
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('gcc_session')?.value;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!sessionToken) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJwt(sessionToken);
    if (!payload) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('gcc_session');
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', (payload.sub as string) || '');
    response.headers.set('x-user-email', (payload.email as string) || '');
    response.headers.set('x-user-role', (payload.role as string) || '');
    return response;
  }

  if (pathname.startsWith('/admin')) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyJwt(sessionToken);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('gcc_session');
      return response;
    }

    const role = payload.role as string;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', (payload.sub as string) || '');
    response.headers.set('x-user-email', (payload.email as string) || '');
    response.headers.set('x-user-role', role);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
