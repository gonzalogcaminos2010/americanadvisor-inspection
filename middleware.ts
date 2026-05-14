import { NextRequest, NextResponse } from 'next/server';

/**
 * Centralized route protection.
 *
 * Runs on the Edge runtime, so localStorage is not available.
 * Authentication is determined by the presence of the 'auth-token' cookie,
 * which is set/cleared by lib/auth.tsx whenever the user logs in or out.
 *
 * Protected prefixes:
 *   /dashboard/* — admin / supervisor area
 *   /inspector/* — inspector area
 *
 * Role-based redirects (e.g. inspector trying to reach /dashboard) are NOT
 * enforced here — that logic stays client-side in lib/auth.tsx and the
 * individual layouts, since the middleware cannot verify the role without
 * decoding a JWT or making an external request.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/inspector');

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination so the login page can redirect back
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match /dashboard and all its sub-routes, plus /inspector and all its
     * sub-routes. Static files, API routes and Next.js internals are excluded
     * automatically by Next.js when using this pattern style.
     */
    '/dashboard/:path*',
    '/inspector/:path*',
  ],
};
