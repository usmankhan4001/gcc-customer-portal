import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateMagicToken } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MagicLinkRequest {
  email: string;
  whatsapp_number?: string;
}

interface MagicLinkResponse {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function sendWhatsAppMagicLink(
  phoneNumber: string,
  magicUrl: string
): Promise<boolean> {
  try {
    const result = await sendWhatsAppMessage(phoneNumber, 'magic_login_link', 'en', [
      { type: 'text', text: magicUrl },
    ]);
    return result.success;
  } catch (error) {
    console.error('[auth/magic-link] WhatsApp dispatch failed:', error);
    return false;
  }
}

async function sendEmailMagicLink(
  email: string,
  magicUrl: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@gccstartup.com';

  if (!resendApiKey) {
    console.log('[auth/magic-link] RESEND_API_KEY not set, skipping email');
    return false;
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your GCCStartup Login Link',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Login Link</h2>
          <p>Click below to access your GCCStartup portal:</p>
          <a href="${magicUrl}"
             style="display: inline-block; padding: 12px 24px; background: #00C896; color: #fff; text-decoration: none; border-radius: 8px;">
            Access Portal
          </a>
          <p style="color: #666; margin-top: 24px; font-size: 14px;">
            This link expires in 15 minutes. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[auth/magic-link] Email dispatch failed:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/magic-link
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as MagicLinkRequest;
    const { email, whatsapp_number } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      );
    }

    // whatsapp_number is NOT NULL on users — only required the first time a
    // given email signs in, since an existing user already has one on file.
    const existingByEmail = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
    if (!existingByEmail && !whatsapp_number) {
      return NextResponse.json(
        { error: 'Missing required field: whatsapp_number (required for first-time sign in)' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 1. Look up user by email, create if not found
    let user = await queryOne<{ id: string; email: string; whatsapp_number: string | null; full_name: string }>(
      `SELECT id, email, whatsapp_number, full_name FROM users WHERE email = $1`,
      [email]
    );

    if (!user) {
      const newId = crypto.randomUUID();
      user = await queryOne<{ id: string; email: string; whatsapp_number: string | null; full_name: string }>(
        `INSERT INTO users (id, email, whatsapp_number, full_name, role) VALUES ($1, $2, $3, $4, 'client') RETURNING id, email, whatsapp_number, full_name`,
        [newId, email, whatsapp_number, email.split('@')[0]]
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or find user' },
        { status: 500 }
      );
    }

    // 2. Generate magic token
    const magicToken = generateMagicToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 3. Store token on user record
    await query(
      `UPDATE users SET magic_token = $1, magic_token_expires_at = $2 WHERE id = $3`,
      [magicToken, expiresAt.toISOString(), user.id]
    );

    // 4. Build magic link URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gccstartup.com';
    const magicUrl = `${appUrl}/api/auth/verify?token=${magicToken}`;

    // 5. Dispatch via WhatsApp
    let whatsappSent = false;
    const phone = whatsapp_number ?? user.whatsapp_number;
    if (phone) {
      whatsappSent = await sendWhatsAppMagicLink(phone, magicUrl);
    }

    // 6. Dispatch via email
    let emailSent = false;
    emailSent = await sendEmailMagicLink(email, magicUrl);

    const channels = [
      whatsappSent ? 'WhatsApp' : null,
      emailSent ? 'email' : null,
    ].filter(Boolean);

    const response: MagicLinkResponse = {
      success: true,
      message: `Magic link sent via ${channels.join(' and ') || 'no channel'}. Link expires in 15 minutes.`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[auth/magic-link] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
