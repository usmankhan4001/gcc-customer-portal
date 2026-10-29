import { describe, expect, it } from 'vitest';
import {
  generateMagicToken,
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyToken,
} from './auth';

describe('JWT', () => {
  it('round-trips a payload', async () => {
    const token = await generateToken({ userId: 'u1', email: 'a@b.co', role: 'admin' });
    expect(await verifyToken(token)).toEqual({ userId: 'u1', email: 'a@b.co', role: 'admin' });
  });

  it('rejects tampered and garbage tokens', async () => {
    const token = await generateToken({ userId: 'u1', email: 'a@b.co', role: 'client' });
    expect(await verifyToken(token.slice(0, -2) + 'xx')).toBeNull();
    expect(await verifyToken('not-a-jwt')).toBeNull();
  });
});

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', () => {
    const hash = hashPassword('correct horse');
    expect(verifyPassword('correct horse', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('salts: same password hashes differently', () => {
    expect(hashPassword('x')).not.toBe(hashPassword('x'));
  });

  it('rejects malformed stored hashes instead of throwing', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'nocolon')).toBe(false);
  });
});

describe('magic tokens', () => {
  it('are unique and hash deterministically', () => {
    const a = generateMagicToken();
    expect(a).not.toBe(generateMagicToken());
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toHaveLength(64);
  });
});
