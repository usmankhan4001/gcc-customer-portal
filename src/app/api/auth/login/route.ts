import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { generateToken, verifyPassword } from '@/lib/auth';

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
