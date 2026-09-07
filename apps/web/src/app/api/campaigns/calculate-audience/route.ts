import { NextRequest, NextResponse } from 'next/server';
import { getTargetContacts } from '@/worker/dispatcher';
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
    const { audienceFilter } = body;

    const filterString = typeof audienceFilter === 'string' ? audienceFilter : JSON.stringify(audienceFilter || {});
    const matchingContacts = await getTargetContacts(filterString);

    // Return count and first 5 sample recipients for preview
    const sampleContacts = matchingContacts.slice(0, 5).map((c: any) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer',
      phone: c.phoneNumber,
      email: c.email,
    }));

    return NextResponse.json({
      count: matchingContacts.length,
      sampleContacts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
