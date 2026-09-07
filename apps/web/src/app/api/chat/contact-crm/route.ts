import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

const logger = {
  error: (...args: any[]) => console.error('[Contact CRM]', ...args),
};

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    // TODO: Replace with Drizzle query
    // const contact = await prisma.contact.findUnique({ ... });
    const contact = null as any;

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // TODO: Replace with Drizzle queries for tags, agents, etc.
    return NextResponse.json({
      contact,
      allTags: [],
      allAgents: [],
      leadStages: [
        { id: 'NEW_LEAD', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
        { id: 'CONTACTED', label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
        { id: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
        { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-800' },
        { id: 'WON', label: 'Deal Won', color: 'bg-emerald-100 text-emerald-800' },
        { id: 'LOST', label: 'Deal Lost', color: 'bg-rose-100 text-rose-800' },
      ],
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch contact CRM details');
    return NextResponse.json({ error: 'Failed to fetch contact CRM' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) return authResult.response;
  const { session } = authResult;

  try {
    const body = await request.json();
    const { contactId, leadStage, dealValue, company, city, tagIds, noteText, authorId, assignToId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    // TODO: Replace with Drizzle updates
    // const updatedContact = await prisma.contact.update({ ... });

    return NextResponse.json({ success: true, contact: { id: contactId } });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update contact CRM');
    return NextResponse.json({ error: error.message || 'Failed to update contact CRM' }, { status: 500 });
  }
}
