import { NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function POST() {
  try {
    // Check if any admin already exists — if so, refuse to create another
    const existingAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'super_admin')))
      .limit(1);

    if (existingAdmins.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'An admin user already exists. This endpoint only works for initial setup.',
        },
        { status: 409 }
      );
    }

    // Generate a secure password
    const generatedPassword = randomBytes(12).toString('base64url');
    const passwordHash = hashPassword(generatedPassword);

    const [admin] = await db
      .insert(users)
      .values({
        email: 'admin@gccstartup.com',
        whatsapp_number: '+000000000000',
        full_name: 'GCC Startup Admin',
        password_hash: passwordHash,
        role: 'super_admin',
        country_of_residence: 'UAE',
      })
      .returning();

    // Also set a session cookie so the user is immediately logged in
    const token = await generateToken({
      userId: admin.id,
      email: admin.email ?? '',
      role: admin.role,
    });

    const cookieStore = await cookies();
    cookieStore.set('gcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully. Save these credentials!',
      credentials: {
        email: 'admin@gccstartup.com',
        password: generatedPassword,
        role: 'super_admin',
      },
      note: 'This endpoint is now disabled — it will refuse if called again.',
    });
  } catch (error) {
    console.error('[seed-admin] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account.' },
      { status: 500 }
    );
  }
}
