import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { authenticator } from 'otplib';
import { totp } from 'otplib';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export function generateToken(userId: number, twoFactorEnabled: boolean = false, twoFactorVerified: boolean = false): string {
  return sign({ userId, twoFactorEnabled, twoFactorVerified }, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractToken(authorization?: string): string | null {
  if (!authorization) return null;
  if (!authorization.startsWith('Bearer ')) return null;
  return authorization.split(' ')[1];
}

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return totp.verify({ secret, token });
}