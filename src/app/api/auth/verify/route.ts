import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
}

interface UserRecord {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
}

// ---------------------------------------------------------------------------
// JWT helper
// ---------------------------------------------------------------------------

async function createSessionToken(user: UserRecord): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

// ---------------------------------------------------------------------------
// GET /api/auth/verify?token=xxx
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return new NextResponse(
        '<html><body><h1>Invalid Link</h1><p>Missing token parameter.</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // 1. Look up token in database
    // TODO: Uncomment when database is connected
    // const tokenRecord = await queryOne<TokenRecord>(
    //   `SELECT * FROM magic_tokens WHERE token = $1 AND used = false`,
    //   [token]
    // );

    // Mock token validation
    const mockTokenRecord: TokenRecord = {
      id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      token: token,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // mock: 5 min from now
      used: false,
    };

    const tokenRecord = mockTokenRecord;

    console.log(`[auth/verify] Mock token lookup: ${token}`);

    if (!tokenRecord) {
      return new NextResponse(
        '<html><body><h1>Link Expired or Invalid</h1><p>This magic link has already been used or does not exist. Please request a new one.</p></body></html>',
        {
          status: 401,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // 2. Check expiry
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      return new NextResponse(
        '<html><body><h1>Link Expired</h1><p>This magic link has expired. Please request a new one.</p></body></html>',
        {
          status: 401,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // 3. Mark token as used
    // TODO: Uncomment when database is connected
    // await query(
    //   `UPDATE magic_tokens SET used = true, used_at = NOW() WHERE id = $1`,
    //   [tokenRecord.id]
    // );

    console.log(`[auth/verify] Mock DB: token ${tokenRecord.id} marked as used`);

    // 4. Look up user
    // TODO: Uncomment when database is connected
    // const user = await queryOne<UserRecord>(
    //   `SELECT u.id, u.email, u.role, c.id as company_id
    //    FROM users u
    //    LEFT JOIN companies c ON u.id = c.owner_id
    //    WHERE u.id = $1`,
    //   [tokenRecord.user_id]
    // );

    const mockUser: UserRecord = {
      id: tokenRecord.user_id,
      email: 'user@example.com',
      role: 'owner',
      company_id: crypto.randomUUID(),
    };

    const user = mockUser;

    if (!user) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>User account not found.</p></body></html>',
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // 5. Generate JWT session token
    const sessionToken = await createSessionToken(user);

    // 6. Redirect to dashboard with JWT in cookie
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gccstartup.com';
    const redirectUrl = `${appUrl}/portal/dashboard`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('gcc_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[auth/verify] Error:', error);
    return new NextResponse(
      '<html><body><h1>Server Error</h1><p>Something went wrong. Please try again.</p></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
