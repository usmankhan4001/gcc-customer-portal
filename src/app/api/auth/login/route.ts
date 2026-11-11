import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { generateToken, verifyPassword } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { isStaff } from '@/lib/staff/roles';
import { decryptSecret, verifyTotp } from '@/lib/staff/totp';

export async function POST(request: Request) {
  try {
    const { identifier, password, code } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Please provide your email/phone and password.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanPhone = cleanIdentifier.replace(/\s+/g, '');

    // 5 attempts per identifier+IP per 15 min; same answer whether or not the account exists.
    if (!rateLimit(`login:${cleanIdentifier.toLowerCase()}|${clientIp(request)}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
    }

    // Search user by email or WhatsApp number
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanIdentifier.toLowerCase()),
          eq(users.whatsapp_number, cleanPhone),
          eq(users.whatsapp_number, cleanIdentifier)
        )
      )
      .limit(1);

    // No auto-creation of accounts here. This route used to create a super_admin with a published password
    // whenever admin@gccstartup.com did not exist; local test accounts come from scripts/seed-test-users.ts.
    if (!user || !user.password_hash) {
      return NextResponse.json(
        {
          error:
            'Invalid credentials. If you have not set a password, you can sign in using WhatsApp OTP or complete registration.',
        },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again or use WhatsApp OTP.' },
        { status: 401 }
      );
    }

    // Disabled accounts (offboarded staff) can never sign in. Checked after the password so the answer for a
    // wrong password is the same whether or not the account exists.
    if (user.account_status === 'disabled') {
      return NextResponse.json({ error: 'This account is disabled. Contact your administrator.' }, { status: 403 });
    }

    // Staff with an authenticator enrolled must give the 6-digit code too. The attempt limit above covers
    // guessing it. Enrolment is done from the admin security page once signed in.
    if (isStaff(user.role) && user.totp_enabled && user.totp_secret) {
      const given = typeof code === 'string' ? code.trim() : '';
      if (!given) {
        return NextResponse.json(
          { error: 'Enter the 6-digit code from your authenticator app.', needsCode: true },
          { status: 401 }
        );
      }
      if (!verifyTotp(decryptSecret(user.totp_secret), given)) {
        return NextResponse.json({ error: 'That code is not right or has expired.', needsCode: true }, { status: 401 });
      }
    }

    await db.update(users).set({ last_login_at: new Date() }).where(eq(users.id, user.id));

    const token = await generateToken({
      userId: user.id,
      email: user.email ?? '',
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('gcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        whatsappNumber: user.whatsapp_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[api/auth/login] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
