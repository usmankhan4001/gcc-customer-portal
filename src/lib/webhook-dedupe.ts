import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { processedWebhookEvents } from '@/lib/db/schema';

// Returns true only for the first delivery of an event. Callers must releaseWebhookEvent()
// if processing fails, so the provider's retry is not mistaken for a duplicate.
export async function claimWebhookEvent(source: string, id: string): Promise<boolean> {
  const rows = await db
    .insert(processedWebhookEvents)
    .values({ id: `${source}:${id}`, source })
    .onConflictDoNothing()
    .returning({ id: processedWebhookEvents.id });
  return rows.length > 0;
}

export async function releaseWebhookEvent(source: string, id: string): Promise<void> {
  await db.delete(processedWebhookEvents).where(eq(processedWebhookEvents.id, `${source}:${id}`));
}
