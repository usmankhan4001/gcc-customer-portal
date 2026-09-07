import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// import { WhatsAppClient } from '@/lib/whatsapp/client';
// TODO: Replace with platform-specific auth when available
// import { requireAuth } from '@/lib/auth/rbac';

// Auth stub
async function requireAuth(request: NextRequest) {
  // TODO: Implement platform auth
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  try {
    const body = await request.json();
    const { to, templateName, languageCode, headerMediaUrl, bodyVariables, templateComponents } = body;

    if (!to || !templateName) {
      return NextResponse.json(
        { error: 'Recipient phone number and template name are required' },
        { status: 400 }
      );
    }

    let components = templateComponents;
    if (!components) {
      // TODO: Replace with platform DB client
      // const tpl = await prisma.template.findFirst({ where: { name: templateName } });
      // if (tpl?.components) { components = tpl.components; }
    }

    // TODO: Send via Meta API using WhatsAppClient
    // const client = await WhatsAppClient.createFromSettings();
    // const result = await client.sendTemplateMessage({ to, templateName, languageCode, headerMediaUrl, bodyVariables, templateComponents: components });

    return NextResponse.json({
      success: true,
      result: { id: 'stub-message-id-' + Date.now() },
      message: `Test template message successfully dispatched to ${to}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
