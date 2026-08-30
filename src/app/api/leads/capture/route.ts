import { NextResponse } from 'next/server';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { classifyPersona, type PersonaSignals } from '@/lib/persona';
import { captureServerEvent, identifyServer } from '@/lib/posthog-server';

interface CaptureRequest {
  source_tool: string;
  email?: string;
  whatsapp_number?: string;
  tool_input: Record<string, unknown>;
  tool_result: Record<string, unknown>;
  signals?: PersonaSignals;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CaptureRequest;
    const { source_tool, email, whatsapp_number, tool_input, tool_result, signals } = body;

    if (!source_tool || (!email && !whatsapp_number)) {
      return NextResponse.json(
        { error: 'source_tool and at least one of email/whatsapp_number are required' },
        { status: 400 }
      );
    }

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

    const [row] = await db
      .insert(leads)
      .values({
        email: email ?? existing?.email ?? null,
        whatsapp_number: whatsapp_number ?? existing?.whatsapp_number ?? null,
        source_tool: source_tool as any,
        tool_input,
        tool_result,
        estimated_revenue_band: classification.estimated_revenue_band,
        industry_risk_tier: classification.industry_risk_tier,
        primary_interest_jurisdiction: classification.primary_interest_jurisdiction,
        persona_tag: classification.persona_tag,
        funnel_track: classification.funnel_track,
      })
      .returning();

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

    return NextResponse.json({ lead: row });
  } catch (error) {
    console.error('[api/leads/capture] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
