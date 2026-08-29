import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KYCReviewRequest {
  document_id: string;
  status: 'approved' | 'action_needed' | 'rejected';
  rejection_reason?: string;
  notify_whatsapp: boolean;
}

interface KYCReviewResponse {
  success: boolean;
  document_status: string;
  whatsapp_dispatched: boolean;
  whatsapp_message_id?: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function verifyAdminAuth(request: NextRequest): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const { payload } = await jwtVerify(token, secret);
  const user = payload as unknown as JWTPayload;

  if (user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }

  return user;
}

// ---------------------------------------------------------------------------
// WhatsApp notification helper
// ---------------------------------------------------------------------------

async function sendWhatsAppNotification(
  phoneNumber: string,
  documentStatus: string,
  rejectionReason?: string
): Promise<string | null> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;

  let templateName: string;
  let parameters: Array<{ type: string; text: string }> = [];

  if (documentStatus === 'approved') {
    templateName = 'kyc_approved';
    parameters = [];
  } else if (documentStatus === 'action_needed') {
    templateName = 'kyc_action_needed';
    parameters = [{ type: 'text', text: rejectionReason ?? 'Please resubmit your document.' }];
  } else {
    templateName = 'kyc_rejected';
    parameters = [{ type: 'text', text: rejectionReason ?? 'Document rejected.' }];
  }

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: parameters.length
        ? [{ type: 'body', parameters }]
        : [],
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
  // const data = await res.json();
  // return data.messages?.[0]?.id ?? null;

  console.log('[admin/kyc/review] Mock WhatsApp dispatch:', JSON.stringify(body));
  return `wamid.mock.${Date.now()}`;
}

// ---------------------------------------------------------------------------
// POST /api/admin/kyc/review
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate admin
    let admin: JWTPayload;
    try {
      admin = await verifyAdminAuth(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unauthorized';
      const status = message === 'Insufficient permissions' ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }

    // 2. Parse body
    const body = (await request.json()) as KYCReviewRequest;
    const { document_id, status, rejection_reason, notify_whatsapp } = body;

    if (!document_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: document_id, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['approved', 'action_needed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    if (status !== 'approved' && !rejection_reason) {
      return NextResponse.json(
        { error: 'rejection_reason is required when status is not approved' },
        { status: 400 }
      );
    }

    // 3. Update document status in database
    // TODO: Uncomment when database is connected
    // const document = await queryOne(
    //   `SELECT d.*, c.whatsapp_number, c.owner_email
    //    FROM documents d
    //    JOIN companies c ON d.company_id = c.id
    //    WHERE d.id = $1`,
    //   [document_id]
    // );
    //
    // if (!document) {
    //   return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    // }
    //
    // await query(
    //   `UPDATE documents
    //    SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
    //    WHERE id = $4`,
    //   [status, rejection_reason ?? null, admin.sub, document_id]
    // );

    console.log(
      `[admin/kyc/review] Mock DB update: document ${document_id} → ${status} by ${admin.sub}`
    );

    // 4. Dispatch WhatsApp notification if requested
    let whatsappDispatched = false;
    let whatsappMessageId: string | undefined;

    if (notify_whatsapp) {
      // TODO: Replace with real phone number from database query
      const mockPhoneNumber = '971500000000';
      const messageId = await sendWhatsAppNotification(mockPhoneNumber, status, rejection_reason);
      whatsappDispatched = !!messageId;
      whatsappMessageId = messageId ?? undefined;

      // TODO: Log notification in database
      // await query(
      //   `INSERT INTO notifications (id, company_id, channel, template_name, status, metadata, created_at)
      //    VALUES ($1, $2, 'whatsapp', $3, 'sent', $4, NOW())`,
      //   [crypto.randomUUID(), document.company_id, `kyc_${status}`, JSON.stringify({ document_id, whatsapp_message_id: messageId })]
      // );
    }

    const response: KYCReviewResponse = {
      success: true,
      document_status: status,
      whatsapp_dispatched: whatsappDispatched,
      whatsapp_message_id: whatsappMessageId,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[admin/kyc/review] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
