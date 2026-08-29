import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gccstartup-dev-secret'
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(payload.userId)
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateMagicToken(): string {
  return randomBytes(32).toString('hex');
}
