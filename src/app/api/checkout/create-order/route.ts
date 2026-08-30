import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import type { CompanyJurisdiction, CompanyTier, TrackType } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// POST /api/checkout/create-order
//
// Runs before the user has an account — the onboarding wizard is filled out
// by a guest. This creates the users/companies/orders rows (status: lead /
// unpaid) and a Stripe Checkout Session; webhooks/stripe then flips
// everything to paid/onboarding once payment actually completes.
//
// Note: amount is currently trusted from the client (it mirrors the wizard's
// own tier/add-on pricing table) rather than recomputed server-side — there's
// no live payment flow yet, and the per-jurisdiction pricing matrix itself is
// still unconfirmed business-side for most jurisdictions. Revisit before
// accepting real payments.
// ---------------------------------------------------------------------------

interface CreateOrderRequest {
  email: string;
  whatsapp_number: string;
  full_name: string;
  company_name: string;
  jurisdiction: CompanyJurisdiction;
  tier: CompanyTier;
  track_type: TrackType;
  amount_total: number; // cents
  currency?: string;
  line_items: { label: string; amount: number }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateOrderRequest;
    const {
      email, whatsapp_number, full_name, company_name,
      jurisdiction, tier, track_type, amount_total, line_items,
    } = body;
    const currency = body.currency ?? 'usd';

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid or missing email' }, { status: 400 });
    }
    if (!whatsapp_number || !company_name || !jurisdiction || !tier || !track_type) {
      return NextResponse.json(
        { error: 'Missing required fields: whatsapp_number, company_name, jurisdiction, tier, track_type' },
        { status: 400 }
      );
    }
    if (!amount_total || amount_total <= 0) {
      return NextResponse.json({ error: 'amount_total must be a positive integer (cents)' }, { status: 400 });
    }

    // Find-or-create the user (whatsapp_number is NOT NULL on users, so it's
    // required here even though this is a guest flow).
    let user = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
    if (!user) {
      user = await queryOne<{ id: string }>(
        `INSERT INTO users (id, email, whatsapp_number, full_name, role) VALUES ($1, $2, $3, $4, 'client') RETURNING id`,
        [crypto.randomUUID(), email, whatsapp_number, full_name || email.split('@')[0]]
      );
    }
    if (!user) {
      return NextResponse.json({ error: 'Failed to create or find user' }, { status: 500 });
    }

    const company = await queryOne<{ id: string }>(
      `INSERT INTO companies (id, user_id, company_name, jurisdiction, tier, status, track_type)
       VALUES ($1, $2, $3, $4, $5, 'lead', $6) RETURNING id`,
      [crypto.randomUUID(), user.id, company_name, jurisdiction, tier, track_type]
    );
    if (!company) {
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    const order = await queryOne<{ id: string }>(
      `INSERT INTO orders (id, company_id, user_id, order_type, amount_total, currency, payment_status, line_items)
       VALUES ($1, $2, $3, 'new_formation', $4, $5, 'unpaid', $6) RETURNING id`,
      [crypto.randomUUID(), company.id, user.id, (amount_total / 100).toFixed(2), currency, JSON.stringify(line_items ?? [])]
    );
    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005';
    const session = await createCheckoutSession({
      orderId: order.id,
      companyId: company.id,
      amount: amount_total,
      currency,
      customerEmail: email,
      companyName: company_name,
      successUrl: `${appUrl}/checkout/success?order=${order.id}`,
      cancelUrl: `${appUrl}/setup`,
    });

    return NextResponse.json({ checkout_url: session.url, order_id: order.id, company_id: company.id });
  } catch (error) {
    console.error('[checkout/create-order] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
