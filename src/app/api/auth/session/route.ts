import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('gcc_session')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await queryOne<{ id: string; email: string; full_name: string; role: string; avatar_url: string | null }>(
    `SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1`,
    [payload.userId]
  );

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
