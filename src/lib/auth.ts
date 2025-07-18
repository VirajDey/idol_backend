import { SignJWT, jwtVerify } from 'jose';
import { sha256 } from '@noble/hashes/sha256';
import { authenticator } from 'otplib';
import { totp } from 'otplib';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getSecretKey() {
  // jose expects a Uint8Array for the secret
  return new TextEncoder().encode(JWT_SECRET);
}

// Edge/browser-safe base64 encoding for Uint8Array
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in Edge/Workers and browsers
  return btoa(binary);
}

// WARNING: This is not as secure as bcrypt for password hashing.
// For production, use Argon2 WASM or a proper password hasher if possible.
export async function hashPassword(password: string): Promise<string> {
  // Use sha256 and encode as base64 for demonstration (Edge-compatible)
  const hash = sha256(new TextEncoder().encode(password));
  return toBase64(hash);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = sha256(new TextEncoder().encode(password));
  return toBase64(hash) === hashedPassword;
}

export async function generateToken(userId: number, twoFactorEnabled: boolean = false, twoFactorVerified: boolean = false): Promise<string> {
  return await new SignJWT({ userId, twoFactorEnabled, twoFactorVerified })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<{ userId: number, twoFactorEnabled?: boolean, twoFactorVerified?: boolean } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as any;
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