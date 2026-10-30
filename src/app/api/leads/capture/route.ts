import { NextResponse } from 'next/server';
import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { classifyPersona } from '@/lib/persona';
import { captureServerEvent, identifyServer } from '@/lib/posthog-server';
import { getServerSession } from '@/lib/session';
import { captureRequestSchema, CONSENT_TEXT } from '@/lib/tools/lead-capture';

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Auth-aware session check: if caller is authenticated, default missing email to session email
  const session = await getServerSession();
  const candidateBody =
    typeof rawBody === 'object' && rawBody !== null
      ? {
          ...(rawBody as Record<string, unknown>),
          email:
            (rawBody as Record<string, unknown>).email !== undefined &&
            (rawBody as Record<string, unknown>).email !== ''
              ? (rawBody as Record<string, unknown>).email
              : session?.email,
        }
      : rawBody;

  const parseResult = captureRequestSchema.safeParse(candidateBody);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid request payload',
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const {
    source_tool,
    email: parsedEmail,
    whatsapp_number,
    tool_input,
    tool_result,
    signals,
  } = parseResult.data;

  try {
    const convertedUserId = session?.userId ?? null;
    const email = parsedEmail ?? (session?.email ? session.email : null);

    // Dedup: find the most recent lead for this contact (by whichever of
    // email/whatsapp was given) so a second tool use enriches the persona
    // instead of creating a disconnected duplicate row.
    const matchConditions = [];
    if (email) matchConditions.push(eq(leads.email, email));
    if (whatsapp_number) matchConditions.push(eq(leads.whatsapp_number, whatsapp_number));

    const [existing] = matchConditions.length
      ? await db
          .select()
          .from(leads)
          .where(or(...matchConditions))
          .orderBy(desc(leads.created_at))
          .limit(1)
      : [];

    const classification = classifyPersona(
      signals ?? {},
      existing
        ? {
            persona_tag: existing.persona_tag ?? undefined,
            estimated_revenue_band: existing.estimated_revenue_band ?? undefined,
            industry_risk_tier: existing.industry_risk_tier ?? undefined,
            primary_interest_jurisdiction: existing.primary_interest_jurisdiction ?? undefined,
          }
        : undefined
    );

    // Preserve consent flags and wording in tool_input
    const finalToolInput = { ...tool_input };
    if (typeof finalToolInput.consent === 'boolean' && !finalToolInput.consent_text) {
      finalToolInput.consent_text = CONSENT_TEXT;
    }

    const [row] = await db
      .insert(leads)
      .values({
        email: email ?? existing?.email ?? null,
        whatsapp_number: whatsapp_number ?? existing?.whatsapp_number ?? null,
        source_tool,
        tool_input: finalToolInput,
        tool_result,
        estimated_revenue_band: classification.estimated_revenue_band,
        industry_risk_tier: classification.industry_risk_tier,
        primary_interest_jurisdiction: classification.primary_interest_jurisdiction,
        persona_tag: classification.persona_tag,
        funnel_track: classification.funnel_track,
        converted_user_id: convertedUserId,
      })
      .returning();

    try {
      identifyServer(row.id, {
        email: row.email,
        whatsapp_number: row.whatsapp_number,
        persona_tag: row.persona_tag,
        funnel_track: row.funnel_track,
      });
      captureServerEvent(row.id, 'lead_captured', {
        source_tool: row.source_tool,
        persona_tag: row.persona_tag,
        primary_interest_jurisdiction: row.primary_interest_jurisdiction,
      });
    } catch (err) {
      console.error('[api/leads/capture] PostHog tracking error:', err);
    }

    // Id only: the stored row can hold another visitor's email/phone matched via the dedupe lookup.
    return NextResponse.json({ lead: { id: row.id } });
  } catch (error) {
    console.error('[api/leads/capture] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
