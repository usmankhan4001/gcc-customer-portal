// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// import { WhatsAppClient } from '@/lib/whatsapp/client';
// import { logger } from '@/lib/logger';

const logger = { info: (d: any, m: string) => console.log(m, d), error: (d: any, m: string) => console.error(m, d) };

export interface FlowNodeData {
  label?: string;
  type?: string;
  text?: string;
  templateName?: string;
  buttons?: { id: string; title: string; nextNodeId?: string }[];
  field?: string;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value?: string;
  actionType?: 'ADD_TAG' | 'REMOVE_TAG' | 'ADD_TO_GROUP' | 'UPDATE_CONTACT';
  targetId?: string;
  attributeKey?: string;
  attributeValue?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  data: FlowNodeData;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

/**
 * Initiates or advances an active flow run for an incoming event
 */
export async function processInboundFlow(params: {
  contactId: string;
  phoneNumber: string;
  bodyText: string;
}): Promise<boolean> {
  const { contactId, phoneNumber, bodyText } = params;

  try {
    // TODO: Replace with platform DB client
    // Check for active flow run
    // const activeRun = await prisma.flowRun.findFirst({ where: { contactId, status: 'ACTIVE' }, include: { flow: true } });
    // if (activeRun) return await advanceFlowRun(activeRun.id, bodyText);

    // Check published flows for trigger match
    // const publishedFlows = await prisma.flow.findMany({ where: { status: 'PUBLISHED' } });
    // ... matching logic ...
  } catch (error) {
    logger.error({ error }, '[FlowEngine] Error matching flow');
  }

  return false;
}

/**
 * Advances a flow run step-by-step through its node graph
 */
export async function advanceFlowRun(runId: string, userInput?: string): Promise<boolean> {
  // TODO: Replace with platform DB client and WhatsApp client
  // This is the core flow engine that processes nodes:
  // - message: Send text, interpolate variables, follow edge
  // - quick_reply/buttons: Send options, pause for user input
  // - condition: Evaluate expression, branch true/false
  // - action: Add tag, add to group, update contact variable
  // - trigger: Starting point, follow edge
  // - end: Stop flow

  return false;
}
