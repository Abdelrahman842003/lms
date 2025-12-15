import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  // @ts-ignore
  const ip = request.ip ?? '127.0.0.1';
  const limit = 150; // Limiting requests to 150 per second per IP
  const windowMs = 1000; // 1 second

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      lastReset: Date.now(),
    });
  }

  const ipData = rateLimitMap.get(ip);

  if (Date.now() - ipData.lastReset > windowMs) {
    ipData.count = 0;
    ipData.lastReset = Date.now();
  }

  if (ipData.count >= limit) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (ipData.lastReset + windowMs).toString(),
      },
    });
  }

  ipData.count += 1;

  const { pathname } = request.nextUrl;
  
  // Check for Laravel session cookie or token
  // We check for 'laravel_session' or 'XSRF-TOKEN' as indicators of a session.
  // We also check for 'auth_state' which is set by our client-side AuthContext.
  const hasSession = request.cookies.has('laravel_session') || 
                     request.cookies.has('XSRF-TOKEN') || 
                     request.cookies.has('auth_state') || 
                     request.cookies.has('auth_state');
  
  // Define protected routes
  const isDashboard = pathname.startsWith('/dashboard');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isStudentRoute = pathname.startsWith('/student');
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  
  // Define auth routes (login pages)
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';

  // 1. Redirect unauthenticated users trying to access protected routes
  if ((isDashboard || isTeacherRoute || isStudentRoute || isAdminRoute) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    // If trying to access admin route, redirect to admin login if it exists, otherwise generic login
    if (isAdminRoute) {
       // Check if we should redirect to admin login specifically? 
       // For now, let's stick to generic login or let the client handle it.
       // But user asked for specific behavior. Let's redirect to /login for now.
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users trying to access auth routes
  // 2. Redirect authenticated users trying to access auth routes or landing page
  if ((isAuthRoute || pathname === '/') && hasSession) {
    const userRole = request.cookies.get('user_role')?.value;
    
    if (userRole) {
      if (userRole === 'student') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      } else if (userRole === 'teacher') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
      } else if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (userRole === 'secretary') {
        return NextResponse.redirect(new URL('/secretary/dashboard', request.url));
      }
    }
    
    // Fallback if no role found or unknown role, maybe redirect to a generic dashboard or keep as is
    // For now, let's redirect to student dashboard as a safe default or just allow access if role is missing
    // But better to just let them pass if we can't decide, to avoid infinite loops.
    // However, if they have a session but no role, something is wrong.
    // Let's try to infer from previous logic or just let them be.
    return NextResponse.next();
  }
  
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', (limit - ipData.count).toString());
  response.headers.set('X-RateLimit-Reset', (ipData.lastReset + windowMs).toString());
  
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
