import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTwoFactorToken, generateToken, extractToken, verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { twoFactorCode } = body;

    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader ?? undefined);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as { userId: number, twoFactorEnabled?: boolean, twoFactorVerified?: boolean };

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication not enabled for this user' },
        { status: 400 }
      );
    }

    if (!twoFactorCode || !verifyTwoFactorToken(user.twoFactorSecret, twoFactorCode)) {
      return NextResponse.json(
        { error: 'Invalid two-factor authentication code' },
        { status: 403 }
      );
    }

    // Generate a new token with twoFactorVerified set to true
    const newToken = generateToken(user.id, true, true);

    return NextResponse.json({
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        verified: user.verified,
        credits: user.credits,
        twoFactorEnabled: true,
        twoFactorVerified: true,
      },
    });
  } catch (error) {
    console.error('2FA verification failed:', error);
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    );
  }
}