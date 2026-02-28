import { NextRequest, NextResponse } from 'next/server';

// Protect routes that require authentication
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Identify protected routes
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  if (!isDashboard) return NextResponse.next();

  const token = req.cookies.get('auth_token')?.value;

  // Dashboard requires authentication
  if (isDashboard) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/authentication';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
