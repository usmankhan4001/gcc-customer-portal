import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, companies, documents } from '@/lib/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function performSeed() {
  const adminEmail = 'admin@gccstartup.com';
  const adminPassword = 'AdminPassword123!';

  const clientEmail = 'client@gccstartup.com';
  const clientPassword = 'ClientPassword123!';

  // 1. Admin User
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let adminId = existingAdmin?.id;
  if (existingAdmin) {
    await db
      .update(users)
      .set({
        password_hash: hashPassword(adminPassword),
        role: 'super_admin',
        updated_at: new Date(),
      })
      .where(eq(users.id, existingAdmin.id));
  } else {
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        whatsapp_number: '+971500000001',
        full_name: 'System Administrator',
        password_hash: hashPassword(adminPassword),
        role: 'super_admin',
        country_of_residence: 'UAE',
      })
      .returning();
    adminId = newAdmin.id;
  }

  // 2. Client User
  const [existingClient] = await db
    .select()
    .from(users)
    .where(eq(users.email, clientEmail))
    .limit(1);

  let clientId = existingClient?.id;
  if (existingClient) {
    await db
      .update(users)
      .set({
        password_hash: hashPassword(clientPassword),
        role: 'client',
        updated_at: new Date(),
      })
      .where(eq(users.id, existingClient.id));
  } else {
    const [newClient] = await db
      .insert(users)
      .values({
        email: clientEmail,
        whatsapp_number: '+971501234567',
        full_name: 'Tariq Al-Mansoor',
        password_hash: hashPassword(clientPassword),
        role: 'client',
        country_of_residence: 'UAE',
      })
      .returning();
    clientId = newClient.id;
  }

  // 3. Sample Company & Documents
  const [existingCompany] = await db
    .select()
    .from(companies)
    .where(eq(companies.user_id, clientId!))
    .limit(1);

  if (!existingCompany && clientId) {
    const [newCompany] = await db
      .insert(companies)
      .values({
        user_id: clientId,
        company_name: 'Falcon Global Technologies FZ-LLC',
        jurisdiction: 'uae',
        tier: 'tier_1_self',
        status: 'filing_in_progress',
        track_type: 'gulf',
      })
      .returning();

    await db.insert(documents).values({
      company_id: newCompany.id,
      user_id: clientId,
      category: 'trade_license',
      file_name: 'Trade_License_2026.pdf',
      file_size_bytes: 482910,
      mime_type: 'application/pdf',
      r2_key: 'companies/sample/Trade_License_2026.pdf',
      status: 'active',
    });
    await db.insert(documents).values({
      company_id: newCompany.id,
      user_id: clientId,
      category: 'moa_aoa',
      file_name: 'MoA_Articles_of_Association.pdf',
      file_size_bytes: 1240900,
      mime_type: 'application/pdf',
      r2_key: 'companies/sample/MoA_Articles_of_Association.pdf',
      status: 'active',
    });
  }

  const adminToken = await generateToken({
    userId: adminId!,
    email: adminEmail,
    role: 'super_admin',
  });

  const clientToken = await generateToken({
    userId: clientId!,
    email: clientEmail,
    role: 'client',
  });

  return { adminToken, clientToken };
}

export async function GET(request: NextRequest) {
  try {
    const { adminToken, clientToken } = await performSeed();
    const loginTarget = request.nextUrl.searchParams.get('login');

    if (loginTarget === 'admin') {
      const response = NextResponse.redirect(new URL('/admin', request.url));
      response.cookies.set('gcc_session', adminToken, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    if (loginTarget === 'client') {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.cookies.set('gcc_session', clientToken, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Test users seeded successfully in database!',
      credentials: {
        admin: {
          email: 'admin@gccstartup.com',
          password: 'AdminPassword123!',
          oneClickLogin: `${request.nextUrl.origin}/api/dev/seed-test-users?login=admin`,
        },
        client: {
          email: 'client@gccstartup.com',
          password: 'ClientPassword123!',
          oneClickLogin: `${request.nextUrl.origin}/api/dev/seed-test-users?login=client`,
        },
      },
    });
  } catch (error: any) {
    console.error('[seed-test-users] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
