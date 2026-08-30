import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';

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

// ---------------------------------------------------------------------------
// API route auth helpers
//
// The app authenticates via the httpOnly `gcc_session` cookie (set in
// api/auth/verify, read by middleware.ts). Client JS cannot read an httpOnly
// cookie into an Authorization header, so every route must read the cookie
// directly — do not add Bearer-header auth to a new route, nothing can ever
// supply it.
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const STAFF_ROLES = new Set(['staff', 'operations', 'admin', 'super_admin']);

/** Roles other than 'client' — the coarse staff-vs-customer split used across the app. */
export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.has(role);
}

/** Verified session payload from the `gcc_session` cookie, or throws AuthError(401). */
export async function requireUser(request: NextRequest): Promise<TokenPayload> {
  const token = request.cookies.get('gcc_session')?.value;
  if (!token) throw new AuthError('Unauthorized', 401);

  const payload = await verifyToken(token);
  if (!payload) throw new AuthError('Unauthorized', 401);

  return payload;
}

/** Same as requireUser, but also requires a non-client (staff+) role — throws AuthError(403) otherwise. */
export async function requireStaff(request: NextRequest): Promise<TokenPayload> {
  const payload = await requireUser(request);
  if (!isStaffRole(payload.role)) throw new AuthError('Forbidden', 403);
  return payload;
}
