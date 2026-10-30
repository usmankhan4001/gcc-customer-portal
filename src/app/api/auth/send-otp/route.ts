import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import { otpCodes } from '@/lib/db/schema';
import { hashToken } from '@/lib/auth';
import { devOtpAllowed } from '@/lib/auth-policy';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { sendWhatsAppOtp, sendTextMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

const OTP_TTL_MINUTES = 10;

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

    const { phone } = body || {};

    if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Valid phone number is required' }, { status: 400 });
    }

    const whatsappNumber = normalizePhone(phone);

    // 3 codes per number per 15 min, 10 per client IP per hour (WhatsApp cost and abuse).
    if (
      !rateLimit(`otp:phone:${whatsappNumber}`, 3, 15 * 60 * 1000) ||
      !rateLimit(`otp:ip:${clientIp(request)}`, 10, 60 * 60 * 1000)
    ) {
      return NextResponse.json(
        { success: false, error: 'Too many code requests. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Persist OTP in database — this MUST succeed for verification to work
    try {
      await db.insert(otpCodes).values({
        whatsapp_number: whatsappNumber,
        otp_hash: hashToken(otp),
        expires_at: expiresAt,
      });
    } catch (dbErr) {
      console.error('[Auth] CRITICAL: Database insert for OTP failed — verification will be impossible:', dbErr);
      return NextResponse.json(
        { success: false, error: 'Failed to store verification code. Please try again.' },
        { status: 500 }
      );
    }

    const isWhatsAppConfigured =
      Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
      process.env.WHATSAPP_ACCESS_TOKEN !== 'xxx' &&
      Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      process.env.WHATSAPP_PHONE_NUMBER_ID !== 'xxx';

    let sentViaWhatsApp = false;
    let whatsAppError: string | null = null;

    if (isWhatsAppConfigured) {
      try {
        // Send official WhatsApp OTP via approved template
        const result = await sendWhatsAppOtp(whatsappNumber, otp);
        
        if (result.success) {
          sentViaWhatsApp = true;
        } else {
          // Attempt direct text message fallback
          const textResult = await sendTextMessage(
            whatsappNumber,
            `Your GCC Startup verification code is: ${otp}. Valid for 10 minutes.`
          );
          if (textResult.success) {
            sentViaWhatsApp = true;
          } else {
            console.warn('[WhatsApp] Both template and text message dispatch failed.');
            whatsAppError = 'Meta WhatsApp API dispatch error';
          }
        }
      } catch (err: any) {
        console.error('[WhatsApp] Dispatch exception:', err);
        whatsAppError = err.message || 'WhatsApp dispatch error';
      }
    } else {
      console.warn('[Auth] WhatsApp credentials not configured; no code was sent.');
    }

    // In production a failed send is an error, and the code is never returned to the caller.
    if (!sentViaWhatsApp && !devOtpAllowed()) {
      return NextResponse.json(
        { success: false, error: 'Could not send the verification code. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sentViaWhatsApp ? 'OTP sent via WhatsApp' : 'Verification code generated (Demo mode active)',
      devOtp: devOtpAllowed() ? otp : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
