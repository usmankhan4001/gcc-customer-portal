import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// TODO: Import flow types when available
// import { FlowNode, FlowEdge } from '@/worker/flows';
async function requireAuth(request: NextRequest) {
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}
const logger = { error: (data: any, msg: string) => console.error(msg, data) };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  try {
    const { id } = await params;
    const body = await request.json();
    const { input, currentNodeId: incomingNodeId, variables: incomingVars } = body;

    // TODO: Replace with platform DB client
    const flow = null;
    if (!flow) return NextResponse.json({ error: 'Flow not found' }, { status: 404 });

    let nodes: any[] = [];
    let edges: any[] = [];
    try {
      nodes = JSON.parse((flow as any).nodesJson || '[]');
      edges = JSON.parse((flow as any).edgesJson || '[]');
    } catch {
      return NextResponse.json({ error: 'Corrupt flow canvas JSON' }, { status: 400 });
    }

    const variables: Record<string, any> = {
      firstName: 'John',
      phoneNumber: '+971501234567',
      ...(incomingVars || {}),
    };
    if (input) variables.lastInput = input;

    const findTriggerNode = () => nodes.find((n: any) => n.type === 'trigger') || null;
    let currentNodeId: string | null = incomingNodeId || (flow as any).startNodeId || findTriggerNode()?.id || nodes[0]?.id || null;

    if (incomingNodeId && input) {
      const pausedNode = nodes.find((n: any) => n.id === incomingNodeId);
      if (pausedNode && (pausedNode.type === 'quick_reply' || pausedNode.type === 'buttons')) {
        const buttons = pausedNode.data?.buttons || [];
        const choice = input.trim().toLowerCase();
        const matchedBtn = buttons.find(
          (b: any, i: number) =>
            String(b.title || '').toLowerCase().includes(choice) ||
            choice === String(i + 1) ||
            String(b.id || '').toLowerCase() === choice
        );
        if (matchedBtn) variables.lastInput = matchedBtn.title;
        if (matchedBtn?.nextNodeId) {
          currentNodeId = matchedBtn.nextNodeId;
        } else {
          const nextEdge = edges.find((e: any) => e.source === pausedNode.id);
          currentNodeId = nextEdge ? nextEdge.target : null;
        }
      }
    }

    const simulationLogs: any[] = [];
    const outgoingMessages: string[] = [];
    let buttons: any[] | null = null;
    let steps = 0;

    while (currentNodeId && steps < 20) {
      steps++;
      const node = nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;
      simulationLogs.push({ nodeId: node.id, type: node.type, label: node.data?.label || node.type });

      if (node.type === 'trigger') {
        const nextEdge = edges.find((e: any) => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }
      if (node.type === 'message' || node.type === 'send_message') {
        let text = node.data?.text || '';
        text = text.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => variables[k] || '');
        if (text.trim()) outgoingMessages.push(text);
        const nextEdge = edges.find((e: any) => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }
      if (node.type === 'quick_reply' || node.type === 'buttons') {
        outgoingMessages.push(node.data?.text || 'Select an option:');
        buttons = node.data?.buttons || [];
        currentNodeId = node.id;
        break;
      }
      if (node.type === 'condition') {
        const field = node.data?.field || 'lastInput';
        const operator = node.data?.operator || 'equals';
        const targetVal = (node.data?.value || '').toLowerCase();
        const actualVal = String(variables[field] || '').toLowerCase();
        let conditionMet = false;
        if (operator === 'equals') conditionMet = actualVal === targetVal;
        else if (operator === 'contains') conditionMet = actualVal.includes(targetVal);
        else if (operator === 'greater_than') conditionMet = Number(actualVal) > Number(targetVal);
        else if (operator === 'less_than') conditionMet = Number(actualVal) < Number(targetVal);
        const branchEdge = edges.find((e: any) => e.source === node.id && (conditionMet ? e.sourceHandle === 'true' : e.sourceHandle === 'false')) || edges.find((e: any) => e.source === node.id);
        currentNodeId = branchEdge ? branchEdge.target : null;
        continue;
      }
      if (node.type === 'action') {
        const actionType = node.data?.actionType;
        if (actionType === 'UPDATE_CONTACT' && node.data?.attributeKey) {
          variables[node.data.attributeKey] = node.data.attributeValue;
        }
        const nextEdge = edges.find((e: any) => e.source === node.id);
        currentNodeId = nextEdge ? nextEdge.target : null;
        continue;
      }
      if (node.type === 'end') { currentNodeId = null; break; }
      const nextEdge = edges.find((e: any) => e.source === node.id);
      currentNodeId = nextEdge ? nextEdge.target : null;
    }

    return NextResponse.json({ success: true, currentNodeId, messages: outgoingMessages, message: outgoingMessages[outgoingMessages.length - 1] || null, buttons, variables, logs: simulationLogs });
  } catch (error: any) {
    logger.error({ error }, 'Error in flow simulator');
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
