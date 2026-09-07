import { NextRequest, NextResponse } from 'next/server';
async function requireAuth(request: NextRequest) { return { user: { id: 'stub-user', role: 'ADMIN' } }; }

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  try {
    // TODO: Replace with platform DB client
    return NextResponse.json([]);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  try {
    const body = await request.json();
    const { name, description, rulesJson } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Segment name is required' }, { status: 400 });
    const segment = { id: 'stub-seg-' + Date.now(), name: name.trim(), description, rulesJson: JSON.stringify(rulesJson || {}) };
    return NextResponse.json({ success: true, segment });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Segment ID is required' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
