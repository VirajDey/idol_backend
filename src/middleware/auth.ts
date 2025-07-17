import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractToken } from '../lib/auth';

export async function authMiddleware(request: NextRequest) {
  // Skip authentication for login and register routes
  if (
    request.nextUrl.pathname === '/api/auth/login' ||
    request.nextUrl.pathname === '/api/auth/register'
  ) {
    return;
  }

  const token = extractToken(request.headers.get('authorization') ?? undefined);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const decoded = verifyToken(token) as { userId: number, twoFactorEnabled?: boolean, twoFactorVerified?: boolean };
  
  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Add userId to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-User-Id', decoded.userId.toString());

  // Check for two-factor authentication status
  if (decoded.twoFactorEnabled && !decoded.twoFactorVerified) {
    // Allow access to 2FA verification route, otherwise deny
    if (request.nextUrl.pathname !== '/api/auth/verify-2fa') {
      return NextResponse.json(
        { error: 'Two-factor authentication required' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}