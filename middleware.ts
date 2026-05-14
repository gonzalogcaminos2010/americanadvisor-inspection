import { NextRequest, NextResponse } from 'next/server';

/**
 * Centralized route protection.
 *
 * Protects all routes except /login and / (root redirect).
 * Auth token is read from the 'auth-token' cookie set by lib/auth.tsx.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = pathname === '/login' || pathname === '/';

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
