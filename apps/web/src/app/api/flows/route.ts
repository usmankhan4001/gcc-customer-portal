import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// TODO: Replace with platform-specific auth when available
// import { requireAuth } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

async function requireAuth(request: NextRequest) {
  return { user: { id: 'stub-user', role: 'ADMIN' }, session: { userId: 'stub-user' } };
}

const logger = { error: (data: any, msg: string) => console.error(msg, data) };

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  try {
    const flows: any[] = [];
    return NextResponse.json(flows);
  } catch (error: any) {
    logger.error({ error }, 'Error fetching flows');
    return NextResponse.json({ error: 'Failed to retrieve flows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  const { session } = authResult;
  try {
    const body = await request.json();
    const { name, description, nodesJson, edgesJson } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Flow name is required' }, { status: 400 });
    }

    const initialNodes = nodesJson || JSON.stringify([
      { id: 'start_1', type: 'trigger', data: { label: 'Start Flow', type: 'ANY_INBOUND' }, position: { x: 250, y: 50 } },
      { id: 'msg_1', type: 'message', data: { label: 'Welcome Message', text: 'Hello {{firstName}}! How can we help you today?' }, position: { x: 250, y: 180 } },
    ]);
    const initialEdges = edgesJson || JSON.stringify([{ id: 'e1', source: 'start_1', target: 'msg_1' }]);

    // TODO: Replace with platform DB client
    const flow = {
      id: 'stub-flow-' + Date.now(),
      name: name.trim(),
      description: description?.trim() || null,
      status: 'DRAFT',
      startNodeId: 'start_1',
      nodesJson: initialNodes,
      edgesJson: initialEdges,
      createdBy: session.userId,
      createdAt: new Date(),
    };

    return NextResponse.json({ success: true, flow });
  } catch (error: any) {
    logger.error({ error }, 'Error creating flow');
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 });
  }
}
