import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hashPassword, generateToken, generateTwoFactorSecret } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, walletAddress, enableTwoFactor } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { walletAddress: walletAddress || '' }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username, email, or wallet address already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    let twoFactorSecret = null;
    if (enableTwoFactor) {
      twoFactorSecret = generateTwoFactorSecret();
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        walletAddress,
        twoFactorSecret,
        twoFactorEnabled: enableTwoFactor || false,
        status: 'active',
        verified: false,
        credits: 0
      },
    });

    // Generate token
    const token = generateToken(user.id, user.twoFactorEnabled || false, false);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        status: user.status,
        verified: user.verified,
        credits: user.credits,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret // Only send if needed for QR code generation on frontend
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}