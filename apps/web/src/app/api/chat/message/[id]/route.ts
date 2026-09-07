import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

const logger = {
  error: (...args: any[]) => console.error('[Message Edit]', ...args),
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Editing message history is ADMIN-only
  const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);
  if ('response' in authResult) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const { body } = await request.json();

    if (!body || typeof body !== 'string') {
      return NextResponse.json(
        { error: 'Valid message body is required for editing.' },
        { status: 400 }
      );
    }

    // TODO: Replace with Drizzle query
    // const message = await prisma.chatMessage.findUnique({ where: { id } });
    const message = null as any;

    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    // TODO: Replace with Drizzle update
    // const updatedMessage = await prisma.chatMessage.update({
    //   where: { id },
    //   data: { body: body.trim() },
    // });

    return NextResponse.json({ success: true, message: { id, body: body.trim() } });
  } catch (error: any) {
    logger.error({ error }, 'Error editing chat message');
    return NextResponse.json(
      { error: 'Failed to edit message.' },
      { status: 500 }
    );
  }
}
