import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  otpauthUri,
  totpCode,
  verifyTotp,
} from '@/lib/staff/totp';

// RFC 6238 appendix B: the SHA-1 secret is the ASCII string "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('totp', () => {
  it('matches the RFC 6238 test vectors', () => {
    expect(totpCode(RFC_SECRET, 59_000, 8)).toBe('94287082');
    expect(totpCode(RFC_SECRET, 1111111109_000, 8)).toBe('07081804');
    expect(totpCode(RFC_SECRET, 20000000000_000, 8)).toBe('65353130');
    expect(totpCode(RFC_SECRET, 59_000)).toBe('287082'); // the 6-digit form authenticator apps show
  });

  it('round-trips base32', () => {
    const raw = Buffer.from('hello staff 2fa');
    expect(base32Decode(base32Encode(raw)).equals(raw)).toBe(true);
    expect(() => base32Decode('not*base32')).toThrow();
  });

  it('accepts the current code and one step either side, nothing else', () => {
    const t = 1_700_000_000_000;
    const now = totpCode(RFC_SECRET, t);
    expect(verifyTotp(RFC_SECRET, now, t)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, t - 30_000), t)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, t + 30_000), t)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, t + 90_000), t)).toBe(false);
    expect(verifyTotp(RFC_SECRET, '12345', t)).toBe(false);
    expect(verifyTotp(RFC_SECRET, 'abcdef', t)).toBe(false);
  });

  it('encrypts the stored secret and detects tampering', () => {
    const secret = generateTotpSecret();
    const stored = encryptSecret(secret);
    expect(stored).not.toContain(secret);
    expect(decryptSecret(stored)).toBe(secret);
    const [iv, tag, enc] = stored.split('.');
    const flipped = Buffer.from(enc, 'base64');
    flipped[0] ^= 1;
    expect(() => decryptSecret([iv, tag, flipped.toString('base64')].join('.'))).toThrow();
  });

  it('builds a scannable otpauth link', () => {
    const uri = otpauthUri('ABC234', 'va@example.com');
    expect(uri).toMatch(/^otpauth:\/\/totp\/GCCStartup%3Ava%40example\.com\?secret=ABC234&issuer=GCCStartup/);
  });
});
