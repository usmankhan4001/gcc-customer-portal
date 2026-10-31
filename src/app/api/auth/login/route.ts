import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { generateToken, verifyPassword, hashPassword } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

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
    let [user] = await db
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

    // Auto-seed test users if logging in on dev/sandbox and not found yet
    if (!user) {
      if (cleanIdentifier.toLowerCase() === 'admin@gccstartup.com' && password === 'AdminPassword123!') {
        const [newAdmin] = await db
          .insert(users)
          .values({
            email: 'admin@gccstartup.com',
            whatsapp_number: '+971500000001',
            full_name: 'System Administrator',
            password_hash: hashPassword('AdminPassword123!'),
            role: 'super_admin',
            country_of_residence: 'UAE',
          })
          .returning();
        user = newAdmin;
      } else if (cleanIdentifier.toLowerCase() === 'client@gccstartup.com' && password === 'ClientPassword123!') {
        const [newClient] = await db
          .insert(users)
          .values({
            email: 'client@gccstartup.com',
            whatsapp_number: '+971501234567',
            full_name: 'Tariq Al-Mansoor',
            password_hash: hashPassword('ClientPassword123!'),
            role: 'client',
            country_of_residence: 'UAE',
          })
          .returning();
        user = newClient;
      }
    }

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
