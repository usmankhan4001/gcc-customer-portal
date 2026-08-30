import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:it-team@gccstartup.com';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a real browser push notification via the subscription's endpoint.
 * A parallel channel alongside WhatsApp/email/in-app — not a replacement.
 * The receiving side (service worker push/notificationclick handlers) was
 * already built in public/sw.js; this is what was missing to feed it.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; expired?: boolean }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh_key, auth: subscription.auth_key },
      },
      JSON.stringify({ title: payload.title, body: payload.body, url: payload.url, tag: payload.tag })
    );
    return { success: true };
  } catch (error: any) {
    // 404/410 means the subscription is gone (user uninstalled, cleared
    // data, etc.) — caller should delete the row so it stops retrying.
    const expired = error?.statusCode === 404 || error?.statusCode === 410;
    if (!expired) {
      console.error('Failed to send push notification:', error);
    }
    return { success: false, expired };
  }
}

/**
 * Fans a push notification out to every device a user has subscribed on,
 * pruning subscriptions the push service reports as gone. Used from the
 * same dispatch points as WhatsApp/email (checkout confirmation, KYC
 * advance) so push is genuinely a parallel channel, not a separate
 * notification system to keep in sync by hand.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.user_id, userId));

  for (const sub of subs) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh_key: sub.p256dh_key, auth_key: sub.auth_key },
      payload
    );
    if (result.expired) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
    }
  }
}
