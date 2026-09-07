import { NextRequest } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { session } = authResult;
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');

  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      request.signal.addEventListener('abort', () => {
        isClosed = true;
      });

      // Send initial connection established message
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      let lastChecked = new Date();

      while (!isClosed) {
        try {
          // TODO: Replace with Drizzle query for new messages
          // Poll the database efficiently for new messages
          // const newMessages = await prisma.chatMessage.findMany({ ... });

          // Wait 2 seconds before polling again
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('SSE Error:', error);
          if (!isClosed) {
            controller.error(error);
          }
          break;
        }
      }
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
