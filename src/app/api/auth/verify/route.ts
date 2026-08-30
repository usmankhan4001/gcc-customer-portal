import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateToken } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserRecord {
  id: string;
  email: string;
  role: string;
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

    // 1. Look up user by magic token
    const user = await queryOne<UserRecord>(
      `SELECT id, email, role FROM users WHERE magic_token = $1 AND magic_token_expires_at > NOW()`,
      [token]
    );

    if (!user) {
      return new NextResponse(
        '<html><body><h1>Link Expired or Invalid</h1><p>This magic link has already been used or does not exist. Please request a new one.</p></body></html>',
        {
          status: 401,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // 2. Generate JWT session token
    const sessionToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 3. Clear the magic token
    await query(
      `UPDATE users SET magic_token = NULL, magic_token_expires_at = NULL WHERE id = $1`,
      [user.id]
    );

    // 4. Redirect to dashboard with JWT in cookie
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
