import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { query, queryOne } from '@/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename: string };
}

interface WhatsAppEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

interface WhatsAppWebhookBody {
  object: string;
  entry: WhatsAppEntry[];
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) return false;

  // Meta sends x-hub-signature-256: sha256=<hex>
  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(body).digest('hex')}`;

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// KYC reference detection
// ---------------------------------------------------------------------------

const KYC_REFERENCE_PATTERN = /KYC[- ]?([A-Z0-9]{6,12})/i;

function extractKYCReference(text: string): string | null {
  const match = text.match(KYC_REFERENCE_PATTERN);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/whatsapp
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();

    // 1. Verify webhook signature
    const signature = request.headers.get('X-Hub-Signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET!;

    if (appSecret && !verifyWebhookSignature(body, signature, appSecret)) {
      console.error('[webhooks/whatsapp] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    let payload: WhatsAppWebhookBody;
    try {
      payload = JSON.parse(body) as WhatsAppWebhookBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 });
    }

    // 3. Process entries
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const { messages, statuses } = change.value;

        // Handle incoming messages
        if (messages) {
          for (const message of messages) {
            const body =
              message.type === 'text'
                ? message.text?.body ?? ''
                : `[${message.type}]`;

            // A company may already be linked to this phone number via an
            // existing company owner — best-effort match, not required.
            const owner = await queryOne<{ id: string }>(
              `SELECT c.id FROM companies c
               JOIN users u ON u.id = c.user_id
               WHERE u.whatsapp_number = $1
               ORDER BY c.created_at DESC LIMIT 1`,
              [message.from]
            );

            await query(
              `INSERT INTO whatsapp_messages (id, company_id, phone_number, direction, message_type, body, whatsapp_message_id, status, created_at)
               VALUES ($1, $2, $3, 'inbound', $4, $5, $6, 'received', NOW())
               ON CONFLICT (whatsapp_message_id) DO NOTHING`,
              [crypto.randomUUID(), owner?.id ?? null, message.from, message.type, body, message.id]
            );

            // Check for a self-reported KYC reference in text messages
            if (message.type === 'text' && message.text?.body) {
              const kycRef = extractKYCReference(message.text.body);

              if (kycRef && owner) {
                await query(
                  `UPDATE companies SET official_kyc_reference = $1, updated_at = NOW() WHERE id = $2`,
                  [kycRef, owner.id]
                );
                console.log(`[webhooks/whatsapp] KYC reference ${kycRef} recorded for company ${owner.id}`);
              }
            }
          }
        }

        // Handle status updates for messages we sent
        if (statuses) {
          for (const status of statuses) {
            await query(
              `UPDATE whatsapp_messages SET status = $1 WHERE whatsapp_message_id = $2`,
              [status.status, status.id]
            );
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/whatsapp] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/webhooks/whatsapp — Webhook verification (Meta challenge)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[webhooks/whatsapp] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
