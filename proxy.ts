import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Protect admin routes.
  if (pathname.startsWith('/admin')) {
    // If NEXTAUTH_SECRET is configured, prefer NextAuth token check.
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      const token = await getToken({ req: request, secret });
      if (!token) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      // Fallback to previous admin_auth cookie logic.
      const cookie = request.cookies.get('admin_auth');
      const expectedToken = process.env.ADMIN_TOKEN;
      if (expectedToken) {
        if (!cookie || cookie.value !== expectedToken) {
          const loginUrl = new URL('/admin/login', request.url);
          return NextResponse.redirect(loginUrl);
        }
      } else if (!cookie) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
