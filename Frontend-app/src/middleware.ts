import { NextRequest, NextResponse } from 'next/server';

const dashboardByRole: Record<string, string> = {
  admin: '/dashboard/admin',
  couturier: '/dashboard/couturier',
  client: '/dashboard/client',
};

function clearAuthCookies(response: NextResponse) {
  response.cookies.set('token', '', { path: '/', maxAge: 0 });
  response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('user', '', { path: '/', maxAge: 0 });
  response.cookies.set('user_role', '', { path: '/', maxAge: 0 });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Récupère le token depuis les cookies ou headers
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;

  // Récupère le rôle stocké dans un cookie (à setter lors du login)
  const roleFromCookie = request.cookies.get('user_role')?.value;
  const rawUserCookie = request.cookies.get('user')?.value;
  let role = roleFromCookie;

  if (!role && rawUserCookie) {
    try {
      role = JSON.parse(rawUserCookie).role;
    } catch {
      role = undefined;
    }
  }

  const ownDashboard = role ? dashboardByRole[role] : undefined;

  // Routes publiques - toujours accessibles
  const publicPaths = ['/', '/auth', '/couturiers'];
  const isPublic = publicPaths.some(p =>
    pathname === p || pathname.startsWith('/couturiers/')
  );

  if (isPublic) return NextResponse.next();

  // Si pas de token → redirection login
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (!ownDashboard) {
    return clearAuthCookies(NextResponse.redirect(new URL('/auth', request.url)));
  }

  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(ownDashboard, request.url));
  }

  // Chaque role reste strictement dans son espace.
  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(ownDashboard, request.url));
  }

  if (pathname.startsWith('/dashboard/couturier') && role !== 'couturier') {
    return NextResponse.redirect(new URL(ownDashboard, request.url));
  }

  if (pathname.startsWith('/dashboard/client') && role !== 'client') {
    return NextResponse.redirect(new URL(ownDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
