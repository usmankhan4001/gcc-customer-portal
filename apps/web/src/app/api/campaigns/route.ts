import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
import { getTargetContacts } from '@/worker/dispatcher';
// TODO: Replace with platform-specific auth when available
// import { requireAuth, requireRole } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

// Auth stubs
async function requireAuth(request: NextRequest) {
  // TODO: Implement platform auth
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}

async function requireRole(request: NextRequest, roles: string[]) {
  // TODO: Implement platform RBAC
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}

const logger = {
  error: (data: any, msg: string) => console.error(msg, data),
  info: (data: any, msg: string) => console.log(msg, data),
};

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  try {
    // TODO: Replace with platform DB client
    const campaigns: any[] = [];

    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['SUPER_ADMIN', 'ADMIN']);

  try {
    const body = await request.json();
    const {
      name,
      templateId,
      audienceFilter,
      variableMappings,
      headerMediaUrl,
      scheduledAt,
      startImmediately = true,
    } = body;

    if (!name || !templateId) {
      return NextResponse.json(
        { error: 'Campaign name and template are required' },
        { status: 400 }
      );
    }

    const filterString = typeof audienceFilter === 'string' ? audienceFilter : JSON.stringify(audienceFilter || {});
    const mappingString = typeof variableMappings === 'string' ? variableMappings : JSON.stringify(variableMappings || {});

    // Compute matching target contacts
    const targetContacts = await getTargetContacts(filterString);

    // TODO: Replace with platform DB client
    const campaign = {
      id: 'stub-campaign-' + Date.now(),
      name,
      templateId,
      audienceFilter: filterString,
      variableMappings: mappingString,
      headerMediaUrl: headerMediaUrl?.trim() || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      totalContacts: targetContacts.length,
      status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      campaign,
      note:
        'Dispatch is temporarily disabled pending an audience-resolution fix; the campaign was saved as ' + campaign.status + '.',
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating campaign');
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
