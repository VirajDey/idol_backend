import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyPassword, generateToken, verifyTwoFactorToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, twoFactorCode } = body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Account suspended' },
        { status: 403 }
      );
    }

    // If 2FA is enabled, check the twoFactorCode
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { error: 'Two-factor authentication code required' },
          { status: 403 }
        );
      }
      if (!user.twoFactorSecret || !verifyTwoFactorToken(user.twoFactorSecret, twoFactorCode)) {
        return NextResponse.json(
          { error: 'Invalid two-factor authentication code' },
          { status: 403 }
        );
      }
    }

    const token = await generateToken(user.id, user.twoFactorEnabled || false, user.twoFactorEnabled ? true : false);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        verified: user.verified,
        credits: user.credits,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorVerified: user.twoFactorEnabled ? true : false
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}