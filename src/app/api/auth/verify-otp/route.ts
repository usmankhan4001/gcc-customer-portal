import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { otpCodes, users } from '@/lib/db/schema';
import { generateToken, hashToken } from '@/lib/auth';

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
    let candidateId: string | null = null;

    // Check DB for matching valid OTP
    try {
      const candidates = await db
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
        .limit(5);

      console.log(`[Auth] OTP verify for ${whatsappNumber}: found ${candidates.length} valid OTP(s) in DB`);

      if (candidates.length > 0) {
        console.log(`[Auth] Expected hash: ${candidates[0].otp_hash}, Received hash: ${otpHash}`);
      }

      const candidate = candidates[0];
      if (candidate && candidate.otp_hash === otpHash) {
        isValid = true;
        candidateId = candidate.id;
      } else if (candidates.length > 0) {
        console.warn(`[Auth] OTP hash mismatch for ${whatsappNumber}. User entered wrong code.`);
      } else {
        console.warn(`[Auth] No valid OTP records found for ${whatsappNumber}. Either expired, consumed, or never stored.`);
      }
    } catch (dbErr) {
      console.error('[Auth] DB lookup for OTP failed:', dbErr);
    }

    // Support universal demo/dev fallback OTP (123456) when WhatsApp credentials are not configured or in dev
    const isWhatsAppConfigured =
      Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
      process.env.WHATSAPP_ACCESS_TOKEN !== 'xxx' &&
      Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      process.env.WHATSAPP_PHONE_NUMBER_ID !== 'xxx';

    if (!isValid && (!isWhatsAppConfigured || process.env.NODE_ENV !== 'production')) {
      if (cleanOtp === '123456') {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark OTP as consumed if found in DB
    if (candidateId) {
      try {
        await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, candidateId));
      } catch (err) {
        console.warn('[Auth] Failed to mark OTP as consumed:', err);
      }
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
