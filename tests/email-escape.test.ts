import { describe, expect, it, vi } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({ Resend: class { emails = { send: (...a: unknown[]) => send(...a) }; } }));

describe('sendToolResultEmail', () => {
  it('escapes the title in the HTML body', async () => {
    const { sendToolResultEmail } = await import('@/lib/email');
    await sendToolResultEmail('a@b.co', '<script>alert(1)</script> & "x"', 'https://download.example/x');
    const html = send.mock.calls[0][0].html as string;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;');
  });
});
