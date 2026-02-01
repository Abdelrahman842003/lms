import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitData {
  count: number;
  lastReset: number;
}

const rateLimitMap = new Map<string, RateLimitData>();

// Rate limit configuration
const RATE_LIMIT = 150; // requests per window
const RATE_WINDOW_MS = 1000; // 1 second

/**
 * Valid user roles for type checking
 */
const VALID_ROLES = ['admin', 'teacher', 'student', 'secretary', 'parent', 'academy'] as const;
type UserRole = typeof VALID_ROLES[number];

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  // Try to get IP from headers first (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to CF connecting IP or localhost
  return request.headers.get('cf-connecting-ip') || '127.0.0.1';
}

/**
 * Check and update rate limit for IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let ipData = rateLimitMap.get(ip);

  if (!ipData) {
    ipData = { count: 0, lastReset: now };
    rateLimitMap.set(ip, ipData);
  }

  // Reset window if expired
  if (now - ipData.lastReset > RATE_WINDOW_MS) {
    ipData.count = 0;
    ipData.lastReset = now;
  }

  const allowed = ipData.count < RATE_LIMIT;
  if (allowed) {
    ipData.count += 1;
  }

  return {
    allowed,
    remaining: Math.max(0, RATE_LIMIT - ipData.count),
    resetTime: ipData.lastReset + RATE_WINDOW_MS,
  };
}

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
    admin: '/admin/dashboard',
    secretary: '/secretary/dashboard',
    parent: '/parent/children',
    academy: '/academy/dashboard',
  };

  return new URL(roleRoutes[role as UserRole], baseUrl).toString();
}

export function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);

  // Rate limit exceeded
  if (!rateLimit.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Retry-After': Math.ceil(RATE_WINDOW_MS / 1000).toString(),
      },
    });
  }

  const { pathname } = request.nextUrl;
  
  // Check for auth state cookie (set by client-side AuthContext)
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
    isAdmin: pathname.startsWith('/admin') && !pathname.startsWith('/admin/login'),
  };
  
  const isProtectedRoute = Object.values(protectedRoutes).some(Boolean);
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
  const isLandingPage = pathname === '/';

  // 1. Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL(protectedRoutes.isAdmin ? '/admin/login' : '/login', request.url);
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
  
  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
  
  return response;
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
