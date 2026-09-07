import { NextRequest, NextResponse } from 'next/server';
// TODO: Replace Prisma imports with Drizzle queries
// import { prisma } from '@/lib/prisma';
// import { isModuleEnabled } from '@/lib/modules';
import { requireAuth } from '@/lib/auth/rbac';
// import { logger } from '@/lib/logger';

const logger = {
  error: (...args: any[]) => console.error('[Snippets]', ...args),
};

const DEFAULT_SNIPPETS = [
  {
    shortcut: '/pricing',
    title: 'Pricing & Standard Packages',
    content: 'Hi! Thanks for your interest in our plans. Would you like me to send over our detailed package breakdown? 📊',
    category: 'PRICING',
  },
  {
    shortcut: '/brochure',
    title: 'Product Catalog & Brochure',
    content: 'Here is our complete catalog and solutions brochure: [add your brochure link here] 📄 Let me know if you would like me to explain any specific feature!',
    category: 'GENERAL',
  },
  {
    shortcut: '/demo',
    title: 'Book a 1-on-1 Consultation Demo',
    content: 'We would love to show you a live interactive walkthrough! You can pick a convenient time slot on our calendar here: [add your booking link here] 📅',
    category: 'CLOSING',
  },
  {
    shortcut: '/discount',
    title: 'Limited-Time Seasonal Offer',
    content: 'Great news! We are currently running a limited-time discount — let me know if you would like the details. 🎁',
    category: 'PRICING',
  },
  {
    shortcut: '/location',
    title: 'Office Address & Working Hours',
    content: '📍 [Add your office address here]. We are open [add your working hours here].',
    category: 'SUPPORT',
  },
  {
    shortcut: '/bank-details',
    title: 'Direct Wire / Bank Transfer Info',
    content: 'Bank: [Add your bank name]\nAccount Title: [Add your account title]\nIBAN: [Add your IBAN]\nPlease share payment proof once transferred so we can activate your account immediately! 💳',
    category: 'PRICING',
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) return authResult.response;

  try {
    // TODO: Replace with Drizzle queries
    // const enabled = await isModuleEnabled('canned_snippets');
    const enabled = true;
    if (!enabled) {
      return NextResponse.json({ snippets: [] });
    }

    // TODO: Replace with Drizzle query
    // let list = await prisma.cannedSnippet.findMany({ ... });
    let list = DEFAULT_SNIPPETS as any[];

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    if (query) {
      list = list.filter(
        (s) =>
          s.shortcut.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ snippets: list });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch canned snippets');
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) return authResult.response;

  try {
    const body = await request.json();
    const { shortcut, title, content, category = 'GENERAL', action } = body;

    // TODO: Replace with Drizzle updates
    if (action === 'use' && body.id) {
      return NextResponse.json({ success: true });
    }

    if (!shortcut || !title || !content) {
      return NextResponse.json({ error: 'shortcut, title, and content are required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, snippet: { id: 'mock', shortcut, title, content, category } });
  } catch (error: any) {
    logger.error({ error }, 'Failed to save canned snippet');
    return NextResponse.json({ error: error.message || 'Failed to save snippet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('response' in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing snippet ID' }, { status: 400 });

    // TODO: Replace with Drizzle delete
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}
