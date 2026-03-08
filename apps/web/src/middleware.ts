import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ['/admin'],
  TEACHER: ['/teacher'],
  STUDENT: ['/student'],
};

function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.role as string;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for access token cookie (set by login page)
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = getRoleFromToken(token);

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  for (const [requiredRole, prefixes] of Object.entries(ROLE_ROUTES)) {
    if (prefixes.some((prefix) => pathname.startsWith(prefix))) {
      if (role !== requiredRole) {
        // Redirect to their own dashboard
        const dashboardMap: Record<string, string> = {
          ADMIN: '/admin/dashboard',
          TEACHER: '/teacher/dashboard',
          STUDENT: '/student/dashboard',
        };
        return NextResponse.redirect(new URL(dashboardMap[role] ?? '/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
