import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

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

        const { messages, statuses, metadata } = change.value;

        // Handle incoming messages
        if (messages) {
          for (const message of messages) {
            console.log(
              `[webhooks/whatsapp] Message from ${message.id}: type=${message.type}`
            );

            // Check for KYC reference in text messages
            if (message.type === 'text' && message.text?.body) {
              const kycRef = extractKYCReference(message.text.body);

              if (kycRef) {
                console.log(`[webhooks/whatsapp] KYC reference detected: ${kycRef}`);

                // TODO: Look up document by reference and update status
                // const document = await queryOne(
                //   `SELECT d.*, c.id as company_id
                //    FROM documents d
                //    JOIN companies c ON d.company_id = c.id
                //    WHERE d.reference_number = $1 OR d.id = $1`,
                //   [kycRef]
                // );
                //
                // if (document) {
                //   await query(
                //     `UPDATE documents SET status = 'uploaded', updated_at = NOW() WHERE id = $1`,
                //     [document.id]
                //   );
                // }

                console.log(`[webhooks/whatsapp] Mock DB: KYC reference ${kycRef} processed`);
              }
            }

            // TODO: Log notification in database
            // await query(
            //   `INSERT INTO notifications (id, channel, direction, phone_number, message_id, content, metadata, created_at)
            //    VALUES ($1, 'whatsapp', 'inbound', $2, $3, $4, $5, NOW())`,
            //   [
            //     crypto.randomUUID(),
            //     message.from,
            //     message.id,
            //     message.text?.body ?? `[${message.type}]`,
            //     JSON.stringify({ type: message.type, phone_number_id: metadata.phone_number_id }),
            //   ]
            // );

            console.log(`[webhooks/whatsapp] Mock DB: notification logged for ${message.from}`);
          }
        }

        // Handle status updates
        if (statuses) {
          for (const status of statuses) {
            console.log(
              `[webhooks/whatsapp] Status update: ${status.id} → ${status.status}`
            );

            // TODO: Update notification status in database
            // await query(
            //   `UPDATE notifications SET status = $1, updated_at = NOW() WHERE message_id = $2`,
            //   [status.status, status.id]
            // );
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
