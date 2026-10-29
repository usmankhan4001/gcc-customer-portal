import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import { companies, users, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clientUsers = alias(users, 'client_users');
    const staffUsers = alias(users, 'staff_users');

    const rows = await db
      .select({
        id: companies.id,
        company_name: companies.company_name,
        jurisdiction: companies.jurisdiction,
        tier: companies.tier,
        track_type: companies.track_type,
        status: companies.status,
        official_kyc_completed: companies.official_kyc_completed,
        trade_license_number: companies.trade_license_number,
        created_at: companies.created_at,
        updated_at: companies.updated_at,
        client_id: clientUsers.id,
        client_name: clientUsers.full_name,
        client_email: clientUsers.email,
        client_phone: clientUsers.whatsapp_number,
        assigned_id: staffUsers.id,
        assigned_name: staffUsers.full_name,
        assigned_avatar: staffUsers.avatar_url,
      })
      .from(companies)
      .leftJoin(clientUsers, eq(companies.user_id, clientUsers.id))
      .leftJoin(staffUsers, eq(companies.assigned_to, staffUsers.id))
      .orderBy(desc(companies.updated_at));

    // Fetch latest orders for each company
    const companyOrders = await db
      .select({
        company_id: orders.company_id,
        amount_total: orders.amount_total,
        currency: orders.currency,
        payment_status: orders.payment_status,
        created_at: orders.created_at,
      })
      .from(orders)
      .orderBy(desc(orders.created_at));

    const orderMap = new Map<string, (typeof companyOrders)[0]>();
    for (const o of companyOrders) {
      if (!orderMap.has(o.company_id)) {
        orderMap.set(o.company_id, o);
      }
    }

    const result = rows.map((row) => {
      const latestOrder = orderMap.get(row.id);
      const now = new Date();
      const referenceDate = row.updated_at ? new Date(row.updated_at) : new Date(row.created_at);
      const daysInStage = Math.max(0, Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)));

      let slaStatus: 'green' | 'yellow' | 'red' = 'green';
      if (daysInStage > 7) {
        slaStatus = 'red';
      } else if (daysInStage >= 4) {
        slaStatus = 'yellow';
      }

      return {
        ...row,
        daysInStage,
        slaStatus,
        order: latestOrder
          ? {
              amount_total: latestOrder.amount_total,
              currency: latestOrder.currency,
              payment_status: latestOrder.payment_status,
            }
          : null,
      };
    });

    return NextResponse.json({ companies: result });
  } catch (error: any) {
    console.error('[api/admin/pipeline] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch pipeline' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyId, status, assignedTo } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    const validStatuses = [
      'lead',
      'onboarding',
      'official_kyc_pending',
      'filing_in_progress',
      'bank_opening',
      'active',
      'renewal_due',
      'suspended',
      'archived',
    ];

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
      }
      updateData.status = status;
      if (status === 'active') {
        updateData.incorporation_date = new Date();
        updateData.official_kyc_completed = true;
      }
    }

    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo || null;
    }

    const [updated] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, companyId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    console.error('[api/admin/pipeline] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      companyName,
      jurisdiction,
      tier = 'tier_1_self',
      clientName,
      clientEmail,
      clientPhone,
      status = 'lead',
    } = body;

    if (!companyName || !jurisdiction) {
      return NextResponse.json({ error: 'companyName and jurisdiction are required' }, { status: 400 });
    }

    let clientId: string | null = null;
    if (clientEmail || clientPhone) {
      const matchQueries = [];
      if (clientEmail) matchQueries.push(eq(users.email, clientEmail.trim().toLowerCase()));
      if (clientPhone) matchQueries.push(eq(users.whatsapp_number, clientPhone.trim()));

      const [existing] = await db.select().from(users).where(or(...matchQueries)).limit(1);
      if (existing) {
        clientId = existing.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: clientEmail ? clientEmail.trim().toLowerCase() : null,
            whatsapp_number: clientPhone ? clientPhone.trim() : `temp_${Date.now()}`,
            full_name: clientName || `${companyName} Representative`,
            role: 'client',
          })
          .returning();
        clientId = newUser.id;
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          whatsapp_number: `temp_${Date.now()}`,
          full_name: clientName || `${companyName} Representative`,
          role: 'client',
        })
        .returning();
      clientId = newUser.id;
    }

    const [company] = await db
      .insert(companies)
      .values({
        user_id: clientId,
        company_name: companyName,
        jurisdiction,
        tier,
        status,
        assigned_to: admin.userId,
      })
      .returning();

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('[api/admin/pipeline] POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 });
  }
}
