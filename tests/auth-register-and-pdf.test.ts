import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDbInsert = vi.fn();
const mockDbSelect = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockDbSelect(),
    insert: () => mockDbInsert(),
  },
}));

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: vi.fn(),
  identifyServer: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing or short name', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: '', email: 'test@example.com', password: 'Password123!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('legal name');
  });

  it('rejects short password (< 6 chars)', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: 'John Doe', email: 'test@example.com', password: '123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('at least 6 characters');
  });

  it('rejects existing user with 409 conflict', async () => {
    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: 'existing-id', email: 'test@example.com' }]),
        }),
      }),
    });

    const { POST } = await import('@/app/api/auth/register/route');
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: 'John Doe', email: 'test@example.com', password: 'Password123!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('already exists');
  });

  it('creates new client user and returns 200 with session', async () => {
    mockDbSelect.mockReturnValue({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    });

    mockDbInsert.mockReturnValue({
      values: () => ({
        returning: () =>
          Promise.resolve([
            {
              id: 'user-new-123',
              full_name: 'Tariq Al-Mansoor',
              email: 'tariq@example.com',
              whatsapp_number: '+971501234567',
              country_of_residence: 'UAE',
              role: 'client',
            },
          ]),
      }),
    });

    const { POST } = await import('@/app/api/auth/register/route');
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Tariq Al-Mansoor',
        email: 'tariq@example.com',
        password: 'ClientPassword123!',
        phone: '+971501234567',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('tariq@example.com');
  });
});

describe('POST /api/pdf/download', () => {
  it('rejects request with missing title or rows', async () => {
    const { POST } = await import('@/app/api/pdf/download/route');
    const req = new NextRequest('http://localhost:3000/api/pdf/download', {
      method: 'POST',
      body: JSON.stringify({ title: '', rows: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('generates PDF buffer and returns application/pdf content type', async () => {
    const { POST } = await import('@/app/api/pdf/download/route');
    const req = new NextRequest('http://localhost:3000/api/pdf/download', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Invoice INV-100200',
        subtitle: 'Test Corporation',
        rows: [
          { label: 'Item 1', value: '$1,500.00' },
          { label: 'Total', value: '$1,500.00' },
        ],
        filename: 'invoice-100200.pdf',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('attachment');
  });
});
