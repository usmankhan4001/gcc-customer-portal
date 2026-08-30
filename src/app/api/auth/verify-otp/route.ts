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
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }

    const whatsappNumber = normalizePhone(phone);
    const otpHash = hashToken(otp);

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

    if (!candidate || candidate.otp_hash !== otpHash) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, candidate.id));

    let [user] = await db.select().from(users).where(eq(users.whatsapp_number, whatsappNumber)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({ whatsapp_number: whatsappNumber })
        .returning();
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
