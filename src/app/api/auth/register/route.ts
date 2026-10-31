import { NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { generateToken, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sendWelcomeEmail } from '@/lib/email';
import { captureServerEvent, identifyServer } from '@/lib/posthog-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, phone, countryOfResidence } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full legal name.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '') : null;

    // Check if user already exists
    const matchQueries = [eq(users.email, cleanEmail)];
    if (cleanPhone) {
      matchQueries.push(eq(users.whatsapp_number, cleanPhone));
    }

    const [existing] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(or(...matchQueries))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        full_name: fullName.trim(),
        email: cleanEmail,
        whatsapp_number: cleanPhone || `temp_${Date.now()}`,
        country_of_residence: countryOfResidence || 'United Arab Emirates',
        password_hash: passwordHash,
        role: 'client',
      })
      .returning();

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
    }

    // Generate session token
    const token = await generateToken({
      userId: newUser.id,
      email: newUser.email ?? '',
      role: newUser.role,
    });

    // Send welcome email asynchronously
    if (newUser.email) {
      sendWelcomeEmail(newUser.email, newUser.full_name || 'Member', 'GCC Startup').catch((err) => {
        console.error('[register] Welcome email send error:', err);
      });
    }

    identifyServer(newUser.id, {
      email: newUser.email,
      whatsapp_number: newUser.whatsapp_number,
      country_of_residence: newUser.country_of_residence,
    });
    captureServerEvent(newUser.id, 'registration_completed', { method: 'password_direct' });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set('gcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[api/auth/register] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
