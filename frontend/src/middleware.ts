// frontend/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/profile', '/resume', '/vacancies', '/analytics', '/settings', '/pricing'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  // Unauthenticated user accessing protected route → redirect to /
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Logged-in user opening / → redirect to /dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/profile/:path*', '/resume/:path*', '/vacancies/:path*', '/analytics/:path*', '/settings/:path*', '/pricing/:path*'],
};
