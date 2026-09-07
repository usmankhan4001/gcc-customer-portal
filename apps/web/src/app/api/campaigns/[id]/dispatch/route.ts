import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// TODO: Replace with platform-specific auth when available
// import { requireRole } from '@/lib/auth/rbac';
// import { dispatchCampaign } from '@/worker/dispatcher';
// import { logger } from '@/lib/logger';

// Auth stub
async function requireRole(request: NextRequest, roles: string[]) {
  // TODO: Implement platform RBAC
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}

const logger = {
  error: (data: any, msg: string) => console.error(msg, data),
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. RBAC Check: Admins only
  const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action } = body; // START, PAUSE, RESUME, CANCEL

    // TODO: Replace with platform DB client
    const campaign = null;

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (action === 'START' || action === 'RESUME') {
      // 2026-09 containment: campaign dispatch is disabled platform-wide. The
      // dispatcher resolves audiences using only singular groupId/tagId while the
      // wizard and preview use includeGroups/includeTags, so a campaign previewed
      // for selected groups/tags would actually be broadcast to EVERY active
      // contact. START/RESUME return 409 until audience resolution is unified and
      // regression-tested. PAUSE and CANCEL stay available so already-queued
      // campaigns can still be stopped.
      return NextResponse.json(
        {
          error:
            'Campaign dispatch is temporarily disabled: a known audience-resolution defect would send to every active contact instead of the previewed groups/tags. Fix is in progress.',
        },
        { status: 409 }
      );
    }

    if (action === 'PAUSE') {
      // TODO: Replace with platform DB client
      // await prisma.campaign.updateMany({
      //   where: { id, status: { in: ['QUEUED', 'RUNNING'] } },
      //   data: { status: 'PAUSED' },
      // });
      return NextResponse.json({ success: true, status: 'PAUSED' });
    }

    if (action === 'CANCEL') {
      // TODO: Replace with platform DB client
      // await prisma.campaign.updateMany({
      //   where: { id, status: { in: ['DRAFT', 'SCHEDULED', 'QUEUED', 'RUNNING', 'PAUSED'] } },
      //   data: { status: 'CANCELLED' },
      // });
      return NextResponse.json({ success: true, status: 'CANCELLED' });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    logger.error({ error }, 'Error in campaign dispatch route');
    return NextResponse.json({ error: 'Failed to process campaign action' }, { status: 500 });
  }
}
