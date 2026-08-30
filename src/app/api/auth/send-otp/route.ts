import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import { otpCodes } from '@/lib/db/schema';
import { hashToken } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

const OTP_TTL_MINUTES = 10;

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const whatsappNumber = normalizePhone(phone);
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await db.insert(otpCodes).values({
      whatsapp_number: whatsappNumber,
      otp_hash: hashToken(otp),
      expires_at: expiresAt,
    });

    // Requires an approved WhatsApp "Authentication" category template named
    // `otp_verification` with one body parameter (the code) — swap this name
    // for whatever the real approved template is called in Meta Business Manager.
    const result = await sendWhatsAppMessage(whatsappNumber, 'otp_verification', 'en', [
      { type: 'text', text: otp },
    ]);

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Failed to send OTP via WhatsApp' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
