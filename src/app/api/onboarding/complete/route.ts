import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { desc, eq, or } from 'drizzle-orm';
import { generateToken, hashPassword, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, users } from '@/lib/db/schema';
import { classifyPersona, bandFromAnnualProfit, type PersonaSignals } from '@/lib/persona';
import { captureServerEvent, identifyServer } from '@/lib/posthog-server';

const BUDGET_MIDPOINTS: Record<string, number> = {
  under_50k: 25000,
  '50k_150k': 100000,
  '150k_500k': 300000,
  over_500k: 750000,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      countryOfResidence,
      goal,
      budgetBand,
      timeline,
      wantsRelocation,
      password,
      phone,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full legal name and email address are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '') : null;

    // Check if request already has an active session
    const cookieStore = await cookies();
    const existingToken = cookieStore.get('gcc_session')?.value;
    let existingSession = existingToken ? await verifyToken(existingToken) : null;

    // Hash password if provided
    let passwordHash: string | undefined = undefined;
    if (password && typeof password === 'string' && password.length >= 6) {
      passwordHash = hashPassword(password);
    }

    let user: any = null;

    if (existingSession?.userId) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingSession.userId))
        .limit(1);
      user = existingUser;
    }

    // If not found by session, check by email or phone
    if (!user) {
      const matchQueries = [eq(users.email, cleanEmail)];
      if (cleanPhone) matchQueries.push(eq(users.whatsapp_number, cleanPhone));

      const [foundUser] = await db
        .select()
        .from(users)
        .where(or(...matchQueries))
        .limit(1);
      user = foundUser;
    }

    if (user) {
      const updateData: Record<string, any> = {
        updated_at: new Date(),
      };
      if (fullName) updateData.full_name = fullName;
      if (cleanEmail) updateData.email = cleanEmail;
      if (countryOfResidence) updateData.country_of_residence = countryOfResidence;
      if (passwordHash) updateData.password_hash = passwordHash;
      if (cleanPhone) updateData.whatsapp_number = cleanPhone;

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    } else {
      // Create fresh user account
      const [created] = await db
        .insert(users)
        .values({
          whatsapp_number: cleanPhone || `temp_${Date.now()}`,
          email: cleanEmail,
          full_name: fullName,
          country_of_residence: countryOfResidence || 'UAE',
          password_hash: passwordHash,
          role: 'client',
        })
        .returning();
      user = created;
    }

    if (!user) {
      return NextResponse.json({ error: 'Could not complete user registration.' }, { status: 500 });
    }

    // Mint session token & set session cookie
    const token = await generateToken({
      userId: user.id,
      email: user.email ?? '',
      role: user.role,
    });

    cookieStore.set('gcc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Dedup persona signals
    const matchConditions = [];
    if (user.email) matchConditions.push(eq(leads.email, user.email));
    if (user.whatsapp_number && !user.whatsapp_number.startsWith('temp_')) {
      matchConditions.push(eq(leads.whatsapp_number, user.whatsapp_number));
    }

    let existingLead = null;
    if (matchConditions.length > 0) {
      const [foundLead] = await db
        .select()
        .from(leads)
        .where(or(...matchConditions))
        .orderBy(desc(leads.created_at))
        .limit(1);
      existingLead = foundLead;
    }

    const signals: PersonaSignals = {
      revenueBand: budgetBand ? bandFromAnnualProfit(BUDGET_MIDPOINTS[budgetBand]) : undefined,
      wantsRelocation: !!wantsRelocation,
      primaryInterestJurisdiction: existingLead?.primary_interest_jurisdiction ?? undefined,
    };

    const classification = classifyPersona(signals, {
      persona_tag: existingLead?.persona_tag ?? undefined,
      estimated_revenue_band: existingLead?.estimated_revenue_band ?? undefined,
      industry_risk_tier: existingLead?.industry_risk_tier ?? undefined,
      primary_interest_jurisdiction: existingLead?.primary_interest_jurisdiction ?? undefined,
    });

    if (existingLead && !existingLead.converted_user_id) {
      await db.update(leads).set({ converted_user_id: user.id }).where(eq(leads.id, existingLead.id));
    }

    identifyServer(user.id, {
      email: user.email,
      whatsapp_number: user.whatsapp_number,
      country_of_residence: countryOfResidence || user.country_of_residence,
      persona_tag: classification.persona_tag,
      funnel_track: classification.funnel_track,
    });
    captureServerEvent(user.id, 'registration_completed', { funnel_track: classification.funnel_track });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        whatsappNumber: user.whatsapp_number,
      },
      funnel_track: classification.funnel_track,
      persona_tag: classification.persona_tag,
    });
  } catch (error) {
    console.error('[api/onboarding/complete] Error:', error);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
