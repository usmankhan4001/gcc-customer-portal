import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { sendUpdateEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import type { ClientMessage } from './events';

type Exec = Pick<typeof db, 'insert'>;

/** Approved Meta template with two text parameters: {{1}} title, {{2}} message. Must exist in WhatsApp Manager. */
export const WHATSAPP_UPDATE_TEMPLATE = 'gcc_client_update';

export interface PendingDelivery {
  notificationId: string;
  userId: string;
  message: ClientMessage;
}

/**
 * Step 1, inside the transaction of the change: record the message. The unique dedupe key makes a repeat a
 * no-op, so it returns null for a message already recorded and nothing is delivered twice. Every message is
 * kept in the portal inbox, whatever other channels it also uses.
 */
export async function queueClientMessage(exec: Exec, userId: string, m: ClientMessage): Promise<PendingDelivery | null> {
  const [row] = await exec
    .insert(notifications)
    .values({ user_id: userId, title: m.title, message: m.message, type: m.type, category: m.category, link_url: m.link, dedupe_key: m.dedupeKey })
    .onConflictDoNothing({ target: notifications.dedupe_key })
    .returning({ id: notifications.id });
  return row ? { notificationId: row.id, userId, message: m } : null;
}

/**
 * Step 2, after the commit: email and WhatsApp. Failures are recorded on the row and never thrown, because
 * the change itself already happened. Payment notices are sent whatever the client's preferences say.
 */
export async function deliverClientMessage({ notificationId, userId, message: m }: PendingDelivery): Promise<void> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;
    const mandatory = m.category === 'payment';
    const update: { email_status?: 'sent' | 'failed'; whatsapp_status?: 'sent' | 'failed' } = {};

    if (m.channels.includes('email') && user.email && (mandatory || user.email_alerts_enabled)) {
      update.email_status = (await sendUpdateEmail(user.email, m.title, m.message, m.link)) ? 'sent' : 'failed';
    }
    if (m.channels.includes('whatsapp') && user.whatsapp_number && (mandatory || user.whatsapp_alerts_enabled)) {
      const r = await sendWhatsAppMessage(user.whatsapp_number, WHATSAPP_UPDATE_TEMPLATE, 'en', [
        { type: 'text', text: m.title },
        { type: 'text', text: m.message },
      ]);
      update.whatsapp_status = r.success ? 'sent' : 'failed';
    }
    if (Object.keys(update).length) await db.update(notifications).set(update).where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error('[notify] delivery failed', error);
  }
}
