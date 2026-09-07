// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';

// TODO: Replace with platform logger
const logger = {
  warn: (...args: any[]) => console.warn('[AssignmentEngine]', ...args),
  error: (...args: any[]) => console.error('[AssignmentEngine]', ...args),
  info: (...args: any[]) => console.info('[AssignmentEngine]', ...args),
};

export class AssignmentEngine {
  /**
   * Automatically routes an incoming conversation to the most available online agent.
   * Replicates WATI's team auto-routing capabilities.
   */
  static async routeConversation(conversationId: string): Promise<void> {
    try {
      // TODO: Replace with Drizzle queries
      // const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      const conv = null as any;
      if (!conv || conv.assignedToId) return; // Already assigned

      // 1. Fetch available agents (Role: MEMBER or ADMIN)
      // TODO: Replace with Drizzle query
      // const availableAgents = await prisma.user.findMany({
      //   where: { isActive: true, status: 'ACTIVE', role: { in: ['MEMBER', 'ADMIN'] } },
      //   select: { id: true }
      // });
      const availableAgents = [] as any[];

      if (availableAgents.length === 0) {
        logger.warn('AssignmentEngine: No available agents to route to.');
        return;
      }

      // 2. Capacity Check: Find how many active OPEN conversations each agent has
      // TODO: Replace with Drizzle query
      // const agentLoads = await prisma.conversation.groupBy({
      //   by: ['assignedToId'],
      //   where: { assignedToId: { in: availableAgents.map(a => a.id) }, status: 'OPEN' },
      //   _count: { assignedToId: true }
      // });
      const agentLoads = [] as any[];

      // Map loads to agents, defaulting to 0 for agents with no chats
      const loadMap = new Map<string, number>();
      for (const agent of availableAgents) {
        loadMap.set(agent.id, 0);
      }
      for (const load of agentLoads) {
        if (load.assignedToId) {
          loadMap.set(load.assignedToId, load._count.assignedToId);
        }
      }

      // 3. Find the agent with the lowest capacity (Least Active Routing)
      let selectedAgentId = availableAgents[0].id;
      let minLoad = Infinity;

      for (const [agentId, load] of loadMap.entries()) {
        if (load < minLoad) {
          minLoad = load;
          selectedAgentId = agentId;
        }
      }

      // 4. Assign the conversation
      // TODO: Replace with Drizzle query
      // await prisma.conversation.update({
      //   where: { id: conversationId },
      //   data: { assignedToId: selectedAgentId }
      // });

      // TODO: Replace with Drizzle query
      // await prisma.conversationEvent.create({
      //   data: {
      //     conversationId: conversationId,
      //     type: 'ASSIGNED',
      //     payload: JSON.stringify({ assignedToId: selectedAgentId, reason: 'auto_capacity_routing' }),
      //   }
      // });

      logger.info(`Conversation auto-assigned: conversationId=${conversationId}, assignedToId=${selectedAgentId}, load=${minLoad}`);

    } catch (error) {
      logger.error(`Error in AssignmentEngine routing: conversationId=${conversationId}, error=${error}`);
    }
  }
}
