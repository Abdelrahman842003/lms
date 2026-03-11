import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Valid user roles for type checking
 */
const VALID_ROLES = ['teacher', 'student', 'secretary', 'parent', 'academy'] as const;
type UserRole = typeof VALID_ROLES[number];

/**
 * Get redirect URL based on user role
 */
function getRedirectUrlForRole(role: string | undefined, baseUrl: string): string | null {
  if (!role || !VALID_ROLES.includes(role as UserRole)) {
    return null;
  }

  const roleRoutes: Record<UserRole, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    secretary: '/secretary/dashboard',
    parent: '/parent/children',
    academy: '/academy/dashboard',
  };

  return new URL(roleRoutes[role as UserRole], baseUrl).toString();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routing hint only (client-managed cookies are not security boundaries).
  const hasSession = request.cookies.has('auth_state');
  const userRole = request.cookies.get('user_role')?.value;

  // Define route types
  const protectedRoutes = {
    isDashboard: pathname.startsWith('/dashboard'),
    isTeacher: pathname.startsWith('/teacher'),
    isStudent: pathname.startsWith('/student'),
    isParent: pathname.startsWith('/parent'),
    isSecretary: pathname.startsWith('/secretary'),
    isAcademy: pathname.startsWith('/academy'),
  };

  const isProtectedRoute = Object.values(protectedRoutes).some(Boolean);
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isLandingPage = pathname === '/';

  // 1. Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users from auth routes to their dashboard
  if ((isAuthRoute || isLandingPage) && hasSession) {
    const redirectUrl = getRedirectUrlForRole(userRole, request.url);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
