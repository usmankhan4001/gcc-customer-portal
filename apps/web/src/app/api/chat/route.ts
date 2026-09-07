import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { WhatsAppClient } from '@/lib/whatsapp/wayapp-client';
import { interpretMetaError } from '@/lib/whatsapp/errors';
import { sanitizePhoneNumber } from '@/lib/whatsapp/wayapp-phone';
// import { logger } from '@/lib/logger';
import { readFile } from 'fs/promises';
import path from 'path';

const logger = {
  error: (...args: any[]) => console.error('[Chat API]', ...args),
  warn: (...args: any[]) => console.warn('[Chat API]', ...args),
  info: (...args: any[]) => console.info('[Chat API]', ...args),
};

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contactId');
  const conversationId = searchParams.get('conversationId');
  const filter = searchParams.get('filter') || 'all'; // all, unread
  const search = searchParams.get('search')?.trim().toLowerCase();
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const cursor = searchParams.get('cursor') || undefined;
  const messageLimit = Math.min(parseInt(searchParams.get('messageLimit') || '100', 10), 500);

  try {
    // TODO: Replace all Prisma queries with Drizzle
    // 1. Fetch message thread for specific contact / conversation
    if (contactId || conversationId) {
      // TODO: Implement with Drizzle
      return NextResponse.json([]);
    }

    // 2. Build conversation filter query
    // TODO: Implement with Drizzle
    return NextResponse.json({ conversations: [], nextCursor: null });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching 1-to-1 chat conversations');
    return NextResponse.json({ error: 'Failed to retrieve conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      contactId,
      phoneNumber,
      text,
      templateName,
      languageCode,
      bodyVariables,
      headerMediaUrl,
      mediaUrl,
      mediaType,
      caption,
      filename,
    } = body;

    // TODO: Replace with Drizzle queries
    let contact: any = null;

    // TODO: Implement contact lookup with Drizzle
    // if (contactId) {
    //   contact = await prisma.contact.findUnique({ where: { id: contactId } });
    // }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found or invalid' }, { status: 404 });
    }

    const client = await WhatsAppClient.createFromSettings();
    let wamid: string | null = null;
    let messageBody = text?.trim() || '';
    let savedMessageType = 'text';
    let savedMediaUrl = mediaUrl || null;

    if (mediaUrl && mediaType) {
      // TODO: Implement media upload logic with Drizzle
      const sendRes = await client.sendMediaMessage({
        to: contact.phoneNumber,
        type: mediaType as 'image' | 'video' | 'audio' | 'document',
        mediaUrl,
        caption: caption?.trim() || text?.trim() || undefined,
        filename: filename || undefined,
      });
      wamid = sendRes.messages?.[0]?.id || null;
      savedMessageType = mediaType;
      messageBody = caption?.trim() || text?.trim() || filename || `[${mediaType.toUpperCase()}]`;
    } else if (templateName) {
      // TODO: Replace with Drizzle query
      // const tpl = await prisma.template.findFirst({ where: { name: templateName } });
      const tpl = null as any;

      const sendRes = await client.sendTemplateMessage({
        to: contact.phoneNumber,
        templateName,
        languageCode: languageCode || tpl?.language || 'en_US',
        headerMediaUrl,
        bodyVariables: bodyVariables || [],
        templateComponents: tpl?.components,
      });
      wamid = sendRes.messages?.[0]?.id || null;
      savedMessageType = 'template';
      messageBody = `[Template: ${templateName}]`;
    } else {
      if (!text?.trim()) {
        return NextResponse.json({ error: 'Message text or attachment is required' }, { status: 400 });
      }

      const sendRes = await client.sendTextMessage(contact.phoneNumber, text.trim());
      wamid = sendRes.messages?.[0]?.id || null;
      savedMessageType = 'text';
    }

    // TODO: Replace with Drizzle upserts
    // Ensure Conversation row exists and update timestamp
    // const conversation = await prisma.conversation.upsert({ ... });
    // const message = await prisma.chatMessage.create({ ... });

    return NextResponse.json({ success: true, message: { id: 'mock', body: messageBody }, conversation: { id: 'mock' } });
  } catch (error: any) {
    logger.error({ error }, 'Error sending WhatsApp 1-to-1 message');
    const is24hWindowRestriction =
      error.code === 131047 ||
      error.code === 131026 ||
      error.code === '131047' ||
      error.code === '131026' ||
      error.message?.includes('24 hours') ||
      error.message?.includes('Re-engagement');

    if (is24hWindowRestriction) {
      return NextResponse.json(
        {
          success: false,
          error:
            'WhatsApp 24-Hour Policy: Freeform text and media messages require an active 24h conversation window. The recipient has not sent a message to your WhatsApp number yet. Please select and send an approved WhatsApp Template to initiate the conversation.',
          requiresTemplate: true,
        },
        { status: 403 }
      );
    }

    const errInfo = interpretMetaError(error.code, error.message);
    return NextResponse.json(
      {
        success: false,
        error: `${errInfo.title}: ${errInfo.userMessage} (${errInfo.action})`,
        category: errInfo.category,
      },
      { status: 400 }
    );
  }
}
