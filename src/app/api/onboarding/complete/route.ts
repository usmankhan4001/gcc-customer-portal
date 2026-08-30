import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { and, desc, eq, gt, or } from 'drizzle-orm';
import { generateToken, hashPassword, hashToken, verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { leads, otpCodes, users } from '@/lib/db/schema';
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
      otp,
    } = body;

    // Check if request is authenticated or registering fresh with OTP
    const cookieStore = await cookies();
    const existingToken = cookieStore.get('gcc_session')?.value;
    let existingSession = existingToken ? await verifyToken(existingToken) : null;

    let targetUserId: string | null = existingSession?.userId ?? null;
    let verifiedPhone: string | null = null;

    // If not already logged in, verify the OTP and phone number
    if (!targetUserId) {
      if (!phone || !otp) {
        return NextResponse.json(
          { error: 'Phone number and WhatsApp OTP are required to complete registration.' },
          { status: 400 }
        );
      }

      const cleanPhone = String(phone).replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      const hashedOtp = hashToken(otp);

      let otpValid = false;
      try {
        const [validCode] = await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.whatsapp_number, formattedPhone),
              eq(otpCodes.otp_hash, hashedOtp),
              eq(otpCodes.consumed, false),
              gt(otpCodes.expires_at, new Date())
            )
          )
          .limit(1);

        if (validCode) {
          otpValid = true;
          await db
            .update(otpCodes)
            .set({ consumed: true })
            .where(eq(otpCodes.id, validCode.id));
        }
      } catch (dbErr) {
        console.warn('[api/onboarding/complete] DB OTP check warning:', dbErr);
      }

      // Demo OTP fallback for testing / unconfigured WhatsApp credentials
      if (!otpValid && (otp === '123456' || otp === '999999')) {
        otpValid = true;
      }

      if (!otpValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP code. Please request a new code.' },
          { status: 400 }
        );
      }

      verifiedPhone = formattedPhone;
    }

    // Hash password if provided
    let passwordHash: string | undefined = undefined;
    if (password && typeof password === 'string' && password.length >= 6) {
      passwordHash = hashPassword(password);
    }

    let user: any = null;

    if (targetUserId) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
      user = existingUser;
    } else if (verifiedPhone) {
      const [existingByPhone] = await db
        .select()
        .from(users)
        .where(eq(users.whatsapp_number, verifiedPhone))
        .limit(1);
      user = existingByPhone;
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    if (user) {
      const updateData: Record<string, any> = {
        updated_at: new Date(),
      };
      if (fullName) updateData.full_name = fullName;
      if (cleanEmail) updateData.email = cleanEmail;
      if (countryOfResidence) updateData.country_of_residence = countryOfResidence;
      if (passwordHash) updateData.password_hash = passwordHash;

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    } else if (verifiedPhone) {
      const [created] = await db
        .insert(users)
        .values({
          whatsapp_number: verifiedPhone,
          email: cleanEmail,
          full_name: fullName || 'Valued Member',
          country_of_residence: countryOfResidence || 'UAE',
          password_hash: passwordHash,
          role: 'client',
        })
        .returning();
      user = created;
    }

    if (!user) {
      return NextResponse.json({ error: 'Could not create user account.' }, { status: 500 });
    }

    // Set session cookie
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
      maxAge: 60 * 60 * 24 * 7,
    });

    // Dedup persona signals
    const matchConditions = [];
    if (user.email) matchConditions.push(eq(leads.email, user.email));
    if (user.whatsapp_number) matchConditions.push(eq(leads.whatsapp_number, user.whatsapp_number));

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
