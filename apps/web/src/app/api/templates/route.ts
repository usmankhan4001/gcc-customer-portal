import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace with platform-specific DB client when available
// import { prisma } from '@/lib/db';
// import { ensureDatabaseSchema } from '@/lib/db-init';
// import { WhatsAppClient } from '@/lib/whatsapp/client';
// TODO: Replace with platform-specific auth when available
// import { requireAuth } from '@/lib/auth/rbac';

// Auth stub
async function requireAuth(request: NextRequest) {
  // TODO: Implement platform auth
  return { user: { id: 'stub-user', role: 'ADMIN' } };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  try {
    // TODO: Replace with platform DB client
    const templates: any[] = [];
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  try {
    // TODO: Replace with platform DB client
    const body = await request.json();
    const { name, category, language, components } = body;

    if (!name || !category || !language) {
      return NextResponse.json(
        { error: 'Template name, category, and language are required' },
        { status: 400 }
      );
    }

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // TODO: Create via Meta API using WhatsAppClient
    // const client = await WhatsAppClient.createFromSettings();
    // const metaRes = await client.createTemplate({ name: cleanName, category, language, components });

    const template = {
      id: 'stub-template-' + Date.now(),
      metaId: 'stub-meta-id',
      name: cleanName,
      category,
      language,
      status: 'PENDING',
      components: JSON.stringify(components),
      createdAt: new Date(),
    };

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
