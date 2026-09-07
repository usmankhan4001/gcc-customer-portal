import { NextResponse } from 'next/server';
import { COUNTRIES } from '@/lib/countries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase()?.trim();

  if (q) {
    const filtered = COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
    return NextResponse.json({ countries: filtered });
  }

  return NextResponse.json({
    countries: COUNTRIES,
    total: COUNTRIES.length,
  });
}
