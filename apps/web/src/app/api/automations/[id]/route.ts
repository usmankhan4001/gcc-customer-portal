import { NextRequest, NextResponse } from 'next/server';
async function requireAuth(request: NextRequest) { return { user: { id: 'stub-user', role: 'ADMIN' } }; }

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  try {
    const { id } = await params;
    const body = await request.json();
    // TODO: Replace with platform DB client
    return NextResponse.json({ success: true, automation: { id, ...body } });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  try {
    const { id } = await params;
    // TODO: Replace with platform DB client
    return NextResponse.json({ success: true });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
