import { NextRequest, NextResponse } from 'next/server';
async function requireAuth(request: NextRequest) { return { user: { id: 'stub-user', role: 'ADMIN' } }; }
const logger = { error: (d: any, m: string) => console.error(m, d), warn: (d: any, m: string) => console.warn(m, d) };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  try {
    const { id } = await params;
    const body = await request.json();
    const testMessage = (body.message || '').trim();
    if (!testMessage) return NextResponse.json({ error: 'A test message is required' }, { status: 400 });
    // TODO: Replace with platform DB client and AI provider
    return NextResponse.json({ triggerMatched: true, reply: `Test response for: ${testMessage}`, note: 'Stub response - implement AI provider' });
  } catch (error: any) { logger.error({ error }, '[BotTest] Unexpected error'); return NextResponse.json({ error: 'Bot test failed' }, { status: 500 }); }
}
