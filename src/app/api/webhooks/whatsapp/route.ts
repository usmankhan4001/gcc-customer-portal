import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, notifications, users } from '@/lib/db/schema';
import { sendPushToUser } from '@/lib/push';

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

  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(body).digest('hex')}`;

  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
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

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * A client who's completed KYC on the external government/bank portal
 * (Decision 7) forwards the reference code they received back to us over
 * WhatsApp. This looks up that sender, finds their company currently
 * waiting on KYC, and advances it automatically — no staff/admin
 * document-review step needed for this stage.
 */
async function handleKycReference(fromPhone: string, kycRef: string): Promise<void> {
  const whatsappNumber = normalizePhone(fromPhone);
  const [user] = await db.select().from(users).where(eq(users.whatsapp_number, whatsappNumber)).limit(1);
  if (!user) {
    console.log(`[webhooks/whatsapp] KYC reference ${kycRef} received from unknown number ${whatsappNumber}`);
    return;
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.user_id, user.id), eq(companies.status, 'official_kyc_pending')))
    .orderBy(desc(companies.created_at))
    .limit(1);

  if (!company) {
    console.log(`[webhooks/whatsapp] User ${user.id} has no company awaiting KYC — ignoring reference ${kycRef}`);
    return;
  }

  await db
    .update(companies)
    .set({
      official_kyc_completed: true,
      official_kyc_reference: kycRef,
      status: 'filing_in_progress',
      updated_at: new Date(),
    })
    .where(eq(companies.id, company.id));

  const notifTitle = 'KYC Verified';
  const notifMessage = `Your KYC reference (${kycRef}) for ${company.company_name} has been received. We're now proceeding with government filing.`;

  await db.insert(notifications).values({
    user_id: user.id,
    title: notifTitle,
    message: notifMessage,
    type: 'success',
    category: 'kyc',
    link_url: '/dashboard',
  });

  await sendPushToUser(user.id, { title: notifTitle, body: notifMessage, url: '/dashboard' });

  console.log(`[webhooks/whatsapp] Company ${company.id} advanced to filing_in_progress via KYC ref ${kycRef}`);
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/whatsapp
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();

    const signature = request.headers.get('X-Hub-Signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET!;

    if (appSecret && !verifyWebhookSignature(body, signature, appSecret)) {
      console.error('[webhooks/whatsapp] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: WhatsAppWebhookBody;
    try {
      payload = JSON.parse(body) as WhatsAppWebhookBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 });
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const { messages, statuses } = change.value;

        if (messages) {
          for (const message of messages) {
            if (message.type === 'text' && message.text?.body) {
              const kycRef = extractKYCReference(message.text.body);
              if (kycRef) {
                await handleKycReference(message.from, kycRef);
              }
            }
          }
        }

        // Delivery/read status updates for outbound messages aren't
        // persisted yet — would need a whatsapp_message_id column on
        // notifications to correlate; not needed for anything in v1.
        if (statuses) {
          for (const status of statuses) {
            console.log(`[webhooks/whatsapp] Status update: ${status.id} → ${status.status}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[webhooks/whatsapp] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
