import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { otpCodes, users } from '@/lib/db/schema';
import { generateToken, hashToken } from '@/lib/auth';
import { devOtpAllowed } from '@/lib/auth-policy';

const MAX_OTP_ATTEMPTS = 5;

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { phone, otp } = body || {};

    if (!phone || !otp || typeof phone !== 'string' || typeof otp !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }

    const whatsappNumber = normalizePhone(phone);
    const cleanOtp = otp.trim();
    const otpHash = hashToken(cleanOtp);

    let isValid = false;

    // Check DB for the latest valid OTP for this number
    try {
      const [candidate] = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.whatsapp_number, whatsappNumber),
            eq(otpCodes.consumed, false),
            gt(otpCodes.expires_at, new Date())
          )
        )
        .orderBy(desc(otpCodes.created_at))
        .limit(1);

      if (candidate && candidate.attempts >= MAX_OTP_ATTEMPTS) {
        return NextResponse.json(
          { success: false, error: 'Too many incorrect attempts. Please request a new code.' },
          { status: 429 }
        );
      }

      if (candidate && candidate.otp_hash === otpHash) {
        // Atomic consume: of two concurrent correct submissions only one flips consumed false -> true.
        const [claimed] = await db
          .update(otpCodes)
          .set({ consumed: true })
          .where(and(eq(otpCodes.id, candidate.id), eq(otpCodes.consumed, false)))
          .returning({ id: otpCodes.id });
        isValid = Boolean(claimed);
      } else if (candidate) {
        await db
          .update(otpCodes)
          .set({ attempts: sql`${otpCodes.attempts} + 1` })
          .where(eq(otpCodes.id, candidate.id));
      }
    } catch (dbErr) {
      console.error('[Auth] DB lookup for OTP failed:', dbErr);
    }

    // Fixed dev code 123456, never in production.
    if (!isValid && devOtpAllowed() && cleanOtp === '123456') {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    let user: any = null;
    try {
      const [existingUser] = await db.select().from(users).where(eq(users.whatsapp_number, whatsappNumber)).limit(1);
      user = existingUser;

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({ whatsapp_number: whatsappNumber, role: 'client' })
          .returning();
        user = newUser;
      }
    } catch (dbErr) {
      console.warn('[Auth] DB error querying/creating user, using fallback user profile:', dbErr);
      user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: '',
        role: 'client',
        full_name: null,
      };
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email ?? '',
      role: user.role || 'client',
    });

    const cookieStore = await cookies();
    cookieStore.set('gcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days, matches the token's own expiry
    });

    return NextResponse.json({
      success: true,
      isNewUser: !user.full_name,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
