import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

const logger = {
  error: (...args: any[]) => console.error('[Notes]', ...args),
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // TODO: Replace with Drizzle query
    // const notes = await prisma.conversationNote.findMany({ ... });
    const notes = [] as any[];

    return NextResponse.json(notes);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching notes');
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { session } = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { body: noteBody } = body;

    if (!noteBody?.trim()) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }

    // TODO: Replace with Drizzle insert
    // const note = await prisma.conversationNote.create({ ... });
    // await prisma.conversationEvent.create({ ... });

    const note = { id: 'mock', body: noteBody.trim(), authorId: session.userId, conversationId: id };

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    logger.error({ error }, 'Error creating internal note');
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
