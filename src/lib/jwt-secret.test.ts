import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJwtSecret } from './jwt-secret';

const text = (b: Uint8Array) => new TextDecoder().decode(b);

afterEach(() => vi.unstubAllEnvs());

describe('getJwtSecret', () => {
  it('throws in production when the secret is missing or empty', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('returns the configured secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'prod-secret');
    expect(text(getJwtSecret())).toBe('prod-secret');
  });

  it('falls back to a dev secret outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('JWT_SECRET', '');
    expect(text(getJwtSecret())).toBe('gccstartup-dev-secret');
  });
});
