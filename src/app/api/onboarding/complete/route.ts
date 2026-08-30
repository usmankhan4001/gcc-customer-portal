import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { desc, eq, or } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
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
  const cookieStore = await cookies();
  const token = cookieStore.get('gcc_session')?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fullName, goal, budgetBand, timeline, wantsRelocation, countryOfResidence } = await request.json();

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Dedup: if this contact already did the Jurisdiction Fit quiz (or any
  // tool) as an anonymous lead before signing up, reuse that persona data
  // instead of asking everything again from scratch.
  const matchConditions = [];
  if (user.email) matchConditions.push(eq(leads.email, user.email));
  matchConditions.push(eq(leads.whatsapp_number, user.whatsapp_number));

  const [existingLead] = await db
    .select()
    .from(leads)
    .where(or(...matchConditions))
    .orderBy(desc(leads.created_at))
    .limit(1);

  const signals: PersonaSignals = {
    revenueBand: bandFromAnnualProfit(BUDGET_MIDPOINTS[budgetBand]),
    wantsRelocation: !!wantsRelocation,
    primaryInterestJurisdiction: existingLead?.primary_interest_jurisdiction ?? undefined,
  };

  const classification = classifyPersona(signals, {
    persona_tag: existingLead?.persona_tag ?? undefined,
    estimated_revenue_band: existingLead?.estimated_revenue_band ?? undefined,
    industry_risk_tier: existingLead?.industry_risk_tier ?? undefined,
    primary_interest_jurisdiction: existingLead?.primary_interest_jurisdiction ?? undefined,
  });

  await db
    .update(users)
    .set({
      full_name: fullName || user.full_name,
      country_of_residence: countryOfResidence || user.country_of_residence,
      updated_at: new Date(),
    })
    .where(eq(users.id, user.id));

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
  captureServerEvent(user.id, 'onboarding_completed', { funnel_track: classification.funnel_track });

  return NextResponse.json({
    funnel_track: classification.funnel_track,
    persona_tag: classification.persona_tag,
  });
}
