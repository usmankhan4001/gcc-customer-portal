import { NextRequest, NextResponse } from 'next/server';

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
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

  const body = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: 'magic_login_link',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: magicUrl },
          ],
        },
      ],
    },
  };

  // TODO: Uncomment when WhatsApp integration is live
  // const res = await fetch(
  //   `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(body),
  //   }
  // );
  // return res.ok;

  console.log('[auth/magic-link] Mock WhatsApp dispatch:', JSON.stringify(body));
  return true;
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

  // TODO: Uncomment when Resend integration is live
  // const { Resend } = await import('resend');
  // const resend = new Resend(resendApiKey);
  //
  // await resend.emails.send({
  //   from: fromEmail,
  //   to: email,
  //   subject: 'Your GCCStartup Login Link',
  //   html: `
  //     <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  //       <h2>Your Login Link</h2>
  //       <p>Click below to access your GCCStartup portal:</p>
  //       <a href="${magicUrl}"
  //          style="display: inline-block; padding: 12px 24px; background: #00C896; color: #fff; text-decoration: none; border-radius: 8px;">
  //         Access Portal
  //       </a>
  //       <p style="color: #666; margin-top: 24px; font-size: 14px;">
  //         This link expires in 15 minutes. If you didn't request this, ignore this email.
  //       </p>
  //     </div>
  //   `,
  // });

  console.log(`[auth/magic-link] Mock email to ${email}: ${magicUrl}`);
  return true;
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 1. Look up user by email
    // TODO: Uncomment when database is connected
    // const user = await queryOne(
    //   `SELECT u.id, u.email, u.whatsapp_number, c.id as company_id
    //    FROM users u
    //    LEFT JOIN companies c ON u.id = c.owner_id
    //    WHERE u.email = $1`,
    //   [email]
    // );

    const mockUserId = crypto.randomUUID();
    const mockCompanyId = crypto.randomUUID();

    console.log(`[auth/magic-link] Mock user lookup for ${email}`);

    // 2. Generate magic token
    const magicToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 3. Store token in database
    // TODO: Uncomment when database is connected
    // Invalidate any existing tokens for this user first
    // await query(
    //   `UPDATE magic_tokens SET used = true WHERE user_id = $1 AND used = false`,
    //   [user.id]
    // );
    //
    // await query(
    //   `INSERT INTO magic_tokens (id, user_id, token, expires_at, created_at)
    //    VALUES ($1, $2, $3, $4, NOW())`,
    //   [crypto.randomUUID(), user.id, magicToken, expiresAt.toISOString()]
    // );

    console.log(
      `[auth/magic-link] Mock DB: token stored for user ${mockUserId}, expires ${expiresAt.toISOString()}`
    );

    // 4. Build magic link URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gccstartup.com';
    const magicUrl = `${appUrl}/api/auth/verify?token=${magicToken}`;

    // 5. Dispatch via WhatsApp
    let whatsappSent = false;
    const phone = whatsapp_number; // TODO: fallback to user.whatsapp_number from DB
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
