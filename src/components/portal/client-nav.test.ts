import { describe, expect, it } from 'vitest';
import { activeClientNav, clientBackTarget, clientTitle } from './client-nav';

describe('client nav', () => {
  it.each([
    ['/dashboard', 'Dashboard', null],
    ['/vault', 'Document vault', null],
    ['/services', 'Services & add-ons', null],
    ['/services/uae', 'Services & add-ons', '/services'],
    ['/profile', 'Profile & settings', null],
    ['/notifications', 'Notifications', '/dashboard'],
    ['/support', 'Support', '/dashboard'],
    ['/elsewhere', 'GCCStartup', null],
  ])('%s -> title %s, back %s', (path, title, back) => {
    expect(clientTitle(path)).toBe(title);
    expect(clientBackTarget(path)).toBe(back);
  });

  it('does not match a path that only shares a prefix', () => {
    expect(activeClientNav('/vaulted')).toBeNull();
  });
});
