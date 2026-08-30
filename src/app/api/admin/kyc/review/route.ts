import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { requireStaff, AuthError } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// ---------------------------------------------------------------------------
// Types
//
// The KYC step in this product is a self-serve "handshake": the client
// completes identity verification directly on the government/bank's own
// portal and reports back a reference number (companies.official_kyc_reference)
// — staff review that reference, not an uploaded document, which is why this
// is company-centric rather than document-centric.
// ---------------------------------------------------------------------------

interface KYCReviewRequest {
  company_id: string;
  approved: boolean;
  note?: string;
  notify_whatsapp?: boolean;
}

interface CompanyWithOwner {
  id: string;
  user_id: string;
  status: string;
  official_kyc_reference: string | null;
  whatsapp_number: string;
  full_name: string;
}

// ---------------------------------------------------------------------------
// POST /api/admin/kyc/review
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const staff = await requireStaff(request);

    const body = (await request.json()) as KYCReviewRequest;
    const { company_id, approved, note, notify_whatsapp = true } = body;

    if (!company_id || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, approved' },
        { status: 400 }
      );
    }

    const company = await queryOne<CompanyWithOwner>(
      `SELECT c.id, c.user_id, c.status, c.official_kyc_reference, u.whatsapp_number, u.full_name
       FROM companies c JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [company_id]
    );

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (approved) {
      // Advance the pipeline only if this is genuinely the KYC step — don't
      // regress a company that's already further along.
      const nextStatus = company.status === 'official_kyc_pending' ? 'filing_in_progress' : company.status;
      await query(
        `UPDATE companies SET official_kyc_completed = TRUE, status = $1, updated_at = NOW() WHERE id = $2`,
        [nextStatus, company_id]
      );
    }

    const notifTitle = approved ? 'KYC verified' : 'KYC needs another look';
    const notifMessage = approved
      ? `Your official KYC reference has been verified. We're moving your filing forward.`
      : note || 'We could not verify your KYC reference — please double-check it and resubmit.';

    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
      [crypto.randomUUID(), company.user_id, notifTitle, notifMessage, approved ? 'success' : 'action_required']
    );

    let whatsappDispatched = false;
    let whatsappMessageId: string | undefined;

    if (notify_whatsapp && process.env.WHATSAPP_ACCESS_TOKEN) {
      const result = await sendWhatsAppMessage(
        company.whatsapp_number,
        approved ? 'kyc_verified' : 'kyc_reminder',
        'en',
        approved
          ? [{ type: 'text', text: company.official_kyc_reference ?? '' }]
          : undefined
      );
      whatsappDispatched = result.success;
      whatsappMessageId = result.messageId;
    } else if (notify_whatsapp) {
      console.log('[admin/kyc/review] WHATSAPP_ACCESS_TOKEN not set, skipping WhatsApp send');
    }

    console.log(`[admin/kyc/review] company ${company_id} → approved=${approved} by ${staff.userId}`);

    return NextResponse.json(
      { success: true, company_status: approved ? 'filing_in_progress' : company.status, whatsapp_dispatched: whatsappDispatched, whatsapp_message_id: whatsappMessageId },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/kyc/review] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
