/**
 * Test User & Sandbox Seeder for GCCStartup
 *
 * Creates:
 * 1. Admin Account (admin@gccstartup.com / AdminPassword123!)
 * 2. Client Account (client@gccstartup.com / ClientPassword123!)
 * 3. Sample Company ("Falcon Global Technologies FZ-LLC", UAE Freezone)
 * 4. Sample Documents (Trade License, MoA)
 * 5. Direct login JWT sessions for instant browser cookie injection
 *
 * Run with: npx tsx scripts/seed-test-users.ts
 */

import 'dotenv/config';
import { db } from '../src/lib/db';
import { users, companies, documents } from '../src/lib/db/schema';
import { hashPassword, generateToken } from '../src/lib/auth';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('\n======================================================');
  console.log('  GCCStartup Test User & Sandbox Seeder');
  console.log('======================================================\n');

  const adminEmail = 'admin@gccstartup.com';
  const adminPassword = 'AdminPassword123!';

  const clientEmail = 'client@gccstartup.com';
  const clientPassword = 'ClientPassword123!';

  try {
    // 1. Seed or Update Admin User
    console.log('[1/4] Setting up Admin User...');
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
      console.log('  ✓ Admin updated with new credentials.');
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
      console.log('  ✓ Admin user created.');
    }

    // 2. Seed or Update Client User
    console.log('\n[2/4] Setting up Client User...');
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
      console.log('  ✓ Client updated with new credentials.');
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
      console.log('  ✓ Client user created.');
    }

    // 3. Seed Sample Company
    console.log('\n[3/4] Setting up Active Client Company & Locker...');
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, clientId!))
      .limit(1);

    let companyId = existingCompany?.id;
    if (!existingCompany) {
      const [newCompany] = await db
        .insert(companies)
        .values({
          user_id: clientId!,
          company_name: 'Falcon Global Technologies FZ-LLC',
          jurisdiction: 'uae',
          tier: 'tier_1_self',
          status: 'filing_in_progress',
          track_type: 'gulf',
        })
        .returning();
      companyId = newCompany.id;
      console.log('  ✓ Sample company created: Falcon Global Technologies FZ-LLC');

      // Add Sample Documents for Locker
      await db.insert(documents).values({
        company_id: companyId,
        user_id: clientId!,
        category: 'trade_license',
        file_name: 'Trade_License_2026.pdf',
        file_size_bytes: 482910,
        mime_type: 'application/pdf',
        r2_key: 'companies/sample/Trade_License_2026.pdf',
        status: 'active',
      });
      await db.insert(documents).values({
        company_id: companyId,
        user_id: clientId!,
        category: 'moa_aoa',
        file_name: 'MoA_Articles_of_Association.pdf',
        file_size_bytes: 1240900,
        mime_type: 'application/pdf',
        r2_key: 'companies/sample/MoA_Articles_of_Association.pdf',
        status: 'active',
      });
      console.log('  ✓ Sample corporate kit documents seeded in Locker.');
    } else {
      console.log('  ✓ Client company already exists.');
    }

    // 4. Generate Pre-authenticated Direct Session Tokens
    console.log('\n[4/4] Generating Direct Session JWT Tokens (for instant cookie testing)...');
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

    console.log('\n======================================================');
    console.log('  Test Credentials Ready:');
    console.log('======================================================');
    console.log(`\n👑 [Admin Portal] -> http://localhost:3005/auth`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     super_admin (Access to /admin, /admin/clients, etc.)`);

    console.log(`\n👤 [Client Portal] -> http://localhost:3005/auth`);
    console.log(`   Email:    ${clientEmail}`);
    console.log(`   Password: ${clientPassword}`);
    console.log(`   Role:     client (Access to /dashboard, /vault, /services)`);

    console.log('\n------------------------------------------------------');
    console.log('  Instant Dev / Test Session Cookies (gcc_session):');
    console.log('------------------------------------------------------');
    console.log('Admin Token:\n', adminToken);
    console.log('\nClient Token:\n', clientToken);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Seeder notice:', err.message);
  }
}

main();
