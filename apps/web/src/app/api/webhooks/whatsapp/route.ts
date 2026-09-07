import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { verifyMetaSignature } from '@/lib/whatsapp/signature';
import { MetaWebhookPayload } from '@/lib/whatsapp/types';
import { sanitizePhoneNumber } from '@/lib/whatsapp/wayapp-phone';
// import { decryptString, timingSafeCompare } from '@/lib/crypto';
// import { logger } from '@/lib/logger';
// import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const logger = {
  error: (...args: any[]) => console.error('[Webhook]', ...args),
  warn: (...args: any[]) => console.warn('[Webhook]', ...args),
  info: (...args: any[]) => console.info('[Webhook]', ...args),
};

// Valid status lifecycle ranking to prevent status regression
const STATUS_RANK: Record<string, number> = {
  PENDING: 1,
  SENDING: 2,
  SENT: 3,
  DELIVERED: 4,
  READ: 5,
  REPLIED: 6,
  FAILED: 99,
};

/**
 * GET handler: Meta Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // TODO: Replace with Drizzle query
  // const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  const settings = null as any;

  const configuredToken = settings?.webhookVerifyToken;

  if (
    mode === 'subscribe' &&
    token &&
    configuredToken &&
    token === configuredToken // TODO: Use timingSafeCompare
  ) {
    logger.info('Meta Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

/**
 * POST handler: Ingest delivery receipts, template status approvals & incoming messages from Meta
 */
export async function POST(request: NextRequest) {
  // TODO: Replace with rate limiter
  // const clientIp = getClientIp(request);
  // const rateLimit = checkRateLimit(`webhook:${clientIp}`, { limit: 600, windowSeconds: 60 });

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // TODO: Replace with Drizzle query
    // const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    const settings = null as any;

    const isMock = settings?.isMockMode === true;
    // TODO: Replace with decryptString
    // const appSecret = decryptString(settings?.appSecret);
    const appSecret = null as any;

    // Fail-closed: verify signature unless mock mode is on
    if (!isMock) {
      if (!appSecret || appSecret.trim() === '') {
        logger.warn('Meta Webhook rejected: no appSecret configured and mock mode is off (fail-closed)');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 });
      }
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        logger.warn('Meta Webhook signature validation failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let payload: MetaWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (payload.object !== 'whatsapp_business_account' && payload.object !== 'whatsapp') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // TODO: Process all entries and changes with Drizzle queries
    // For now, return success without processing
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const field = change.field;
        const value: any = change.value;
        if (!value) continue;

        // 1. Template Status Updates
        if (field === 'message_template_status_update' || value.event) {
          // TODO: Replace with Drizzle update
          // await prisma.template.updateMany({ ... });
        }

        // 2. Status Updates (SENT, DELIVERED, READ, FAILED)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            // TODO: Replace with Drizzle updates
          }
        }

        // 3. Incoming Customer Messages & 2-Way Inbox
        if (value.messages && Array.isArray(value.messages)) {
          for (const incoming of value.messages) {
            // TODO: Replace with Drizzle queries for contact, conversation, message creation
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    logger.error({ error }, 'Error in webhook handler');
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
