import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const pathname = request.nextUrl.pathname;
  
  // Si l'utilisateur est connecté et essaie d'accéder à /auth ou /
  if (token && (pathname === '/auth' || pathname === '/')) {
    // Rediriger vers /dashboard qui redirigera selon le rôle
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configurer les routes qui doivent être interceptées
export const config = {
  matcher: ['/auth', '/'],
};

