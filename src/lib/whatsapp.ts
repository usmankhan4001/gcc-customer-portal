import { createHmac, timingSafeEqual } from 'crypto';

const GRAPH_API_URL = 'https://graph.facebook.com/v20.0';

export function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const isConfigured = Boolean(phoneNumberId && accessToken && phoneNumberId !== 'xxx' && accessToken !== 'xxx');
  return { phoneNumberId, accessToken, isConfigured };
}

export const HSM_TEMPLATES = {
  order_confirmed: {
    name: 'order_confirmed',
    language: 'en',
    description: '🎉 Congratulations {name}! Your order for {company} is confirmed. We will begin processing your request shortly.',
  },
  kyc_reminder: {
    name: 'kyc_reminder',
    language: 'en',
    description: '📋 Action Required: Please complete your identity scan to proceed with your registration. This is a mandatory step.',
  },
  kyc_verified: {
    name: 'kyc_verified',
    language: 'en',
    description: '✅ Official Portal Reference ({ref}) received for {company}. Your KYC verification is complete.',
  },
  milestone_complete: {
    name: 'milestone_complete',
    language: 'en',
    description: '🚀 Milestone reached: {stage} for {company} has been completed successfully.',
  },
  renewal_notice: {
    name: 'renewal_notice',
    language: 'en',
    description: '⏰ Renewal Reminder: Your {entity} license expires in {days} days. Please renew to avoid service interruption.',
  },
} as const;

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  languageCode: string,
  parameters?: { type: string; text: string }[]
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const { phoneNumberId, accessToken, isConfigured } = getWhatsAppConfig();
    if (!isConfigured) {
      console.warn('[WhatsApp] Credentials not configured in process.env');
      return { success: false, error: 'Credentials not configured' };
    }

    const recipient = to.replace(/\D/g, '');
    const components = parameters
      ? [{ type: 'body', parameters }]
      : [];

    const response = await fetch(
      `${GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Cloud API Error]:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error };
  }
}

export async function sendTextMessage(
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const { phoneNumberId, accessToken, isConfigured } = getWhatsAppConfig();
    if (!isConfigured) {
      console.warn('[WhatsApp] Credentials not configured in process.env');
      return { success: false, error: 'Credentials not configured' };
    }

    const recipient = to.replace(/\D/g, '');
    const response = await fetch(
      `${GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Text API Error]:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error) {
    console.error('Failed to send WhatsApp text message:', error);
    return { success: false, error };
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const { phoneNumberId, accessToken, isConfigured } = getWhatsAppConfig();
    if (!isConfigured) return;

    const response = await fetch(
      `${GRAPH_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error('Failed to mark message as read:', data);
    }
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      console.error('WHATSAPP_APP_SECRET not configured');
      return false;
    }

    const expectedSignature = createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    const trusted = Buffer.from(`sha256=${expectedSignature}`, 'ascii');
    const received = Buffer.from(signature, 'ascii');

    return timingSafeEqual(trusted, received);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
