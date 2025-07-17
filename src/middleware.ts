import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './middleware/auth';

export async function middleware(request: NextRequest) {
  // Apply authentication middleware to API routes except auth endpoints
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/auth/')
  ) {
    return await authMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
