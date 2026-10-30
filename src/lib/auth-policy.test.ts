import { afterEach, describe, expect, it, vi } from 'vitest';
import { devOtpAllowed, seedAllowed } from './auth-policy';

afterEach(() => vi.unstubAllEnvs());

describe('devOtpAllowed', () => {
  it('is false in production, true otherwise', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(devOtpAllowed()).toBe(false);
    vi.stubEnv('NODE_ENV', 'development');
    expect(devOtpAllowed()).toBe(true);
  });
});

describe('seedAllowed', () => {
  it('is open outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(seedAllowed(null)).toBe(true);
  });

  it('is closed in production without a configured token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_SEED_TOKEN', '');
    expect(seedAllowed('anything')).toBe(false);
  });

  it('requires the exact token in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_SEED_TOKEN', 's3cret-token');
    expect(seedAllowed(null)).toBe(false);
    expect(seedAllowed('wrong-token!')).toBe(false);
    expect(seedAllowed('s3cret-token')).toBe(true);
  });
});
