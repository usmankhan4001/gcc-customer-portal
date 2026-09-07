import { describe, it, expect } from 'vitest'
import { hasPermission } from '../auth/rbac'

describe('RBAC', () => {
  it('super_admin has all permissions', () => {
    expect(hasPermission('super_admin', 'users:read')).toBe(true)
    expect(hasPermission('super_admin', 'contacts:read')).toBe(true)
    expect(hasPermission('super_admin', 'settings:write')).toBe(true)
  })

  it('admin has most permissions', () => {
    expect(hasPermission('admin', 'users:create')).toBe(true)
    expect(hasPermission('admin', 'contacts:read')).toBe(true)
    expect(hasPermission('admin', 'settings:write')).toBe(false)
  })

  it('staff has limited permissions', () => {
    expect(hasPermission('staff', 'contacts:read')).toBe(true)
    expect(hasPermission('staff', 'contacts:create')).toBe(true)
    expect(hasPermission('staff', 'users:read')).toBe(false)
  })

  it('viewer has read-only permissions', () => {
    expect(hasPermission('viewer', 'contacts:read')).toBe(true)
    expect(hasPermission('viewer', 'contacts:create')).toBe(false)
    expect(hasPermission('viewer', 'users:read')).toBe(false)
  })
})
