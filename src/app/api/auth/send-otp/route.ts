import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import { otpCodes } from '@/lib/db/schema';
import { hashToken } from '@/lib/auth';
import { sendWhatsAppMessage, sendTextMessage } from '@/lib/whatsapp';

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
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Persist OTP in database if DB is reachable
    try {
      await db.insert(otpCodes).values({
        whatsapp_number: whatsappNumber,
        otp_hash: hashToken(otp),
        expires_at: expiresAt,
      });
    } catch (dbErr) {
      console.warn('[Auth] Database insert for OTP failed, continuing with fallback:', dbErr);
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
        // Try template message first (Standard Meta WhatsApp OTP template)
        const result = await sendWhatsAppMessage(whatsappNumber, 'otp_verification', 'en', [
          { type: 'text', text: otp },
        ]);
        
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
            console.warn('[WhatsApp] Both template and text message dispatch failed. Check Meta App Token/Permissions.');
            whatsAppError = 'Meta WhatsApp API dispatch error. Verify template "otp_verification" is approved in Meta WABA.';
          }
        }
      } catch (err: any) {
        console.error('[WhatsApp] Dispatch exception:', err);
        whatsAppError = err.message || 'WhatsApp dispatch error';
      }
    } else {
      console.log(`[Auth DEV/DEMO] WhatsApp credentials not configured. OTP for ${whatsappNumber}: ${otp}`);
    }

    // If WhatsApp is unconfigured, failed, or we are in development, provide devOtp
    const isDevOrFallback = !sentViaWhatsApp || process.env.NODE_ENV !== 'production' || !isWhatsAppConfigured;

    return NextResponse.json({
      success: true,
      message: sentViaWhatsApp ? 'OTP sent via WhatsApp' : 'Verification code generated (Demo mode active)',
      devOtp: isDevOrFallback ? otp : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
