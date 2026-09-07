/**
 * Role hierarchy (highest to lowest):
 *   super_admin > admin > staff > viewer
 */

export type Role = 'super_admin' | 'admin' | 'staff' | 'viewer'

const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 3,
  admin: 2,
  staff: 1,
  viewer: 0,
}

type Resource = string
type Action = string

const PERMISSIONS: Record<Role, { resource: string; actions: string[] }[]> = {
  super_admin: [
    { resource: '*', actions: ['*'] },
  ],
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contacts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'deals', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    { resource: 'campaigns', actions: ['create', 'read', 'update', 'delete', 'dispatch'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
  staff: [
    { resource: 'contacts', actions: ['create', 'read', 'update'] },
    { resource: 'deals', actions: ['create', 'read', 'update'] },
    { resource: 'content', actions: ['create', 'read', 'update'] },
    { resource: 'campaigns', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
  viewer: [
    { resource: 'contacts', actions: ['read'] },
    { resource: 'deals', actions: ['read'] },
    { resource: 'content', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
}

/**
 * Check whether a role has a specific permission string.
 * Permission format: "resource:action" (e.g. "contacts:create")
 * @param userRole - The user's role
 * @param permission - Permission string in "resource:action" format
 * @returns true if the role includes the permission
 */
export function hasPermission(userRole: Role, permission: string): boolean {
  if (userRole === 'super_admin') return true

  const [resource, action] = permission.split(':')
  if (!resource || !action) return false

  const rolePermissions = PERMISSIONS[userRole]
  if (!rolePermissions) return false

  return rolePermissions.some(
    (p) => p.resource === resource && p.actions.includes(action),
  )
}

/**
 * Check whether a role can perform an action on a resource.
 * @param userRole - The user's role
 * @param resource - Resource name (e.g. "contacts")
 * @param action - Action name (e.g. "create")
 * @returns true if access is allowed
 */
export function canAccess(userRole: Role, resource: Resource, action: Action): boolean {
  return hasPermission(userRole, `${resource}:${action}`)
}

/**
 * Get the numeric level of a role in the hierarchy.
 * @param role - Role name
 * @returns Numeric level (0 = lowest)
 */
export function getRoleLevel(role: Role): number {
  return ROLE_HIERARCHY[role] ?? -1
}
