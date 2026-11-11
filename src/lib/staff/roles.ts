/**
 * Staff roles and what each may do. One table, copied from the "Permissions" grid in the
 * GCCStartup Sales Portal requirements (4 Nov 2026), so changing who may do what is a one-line edit.
 *
 * DB role values map to a staff role: legacy `admin` is a super admin and legacy `staff` is an
 * incorporation VA, so accounts that exist today keep working. `client` is never staff.
 */

export const STAFF_ROLES = [
  'super_admin',
  'operations',
  'client_relations',
  'incorporation_va',
  'marketing_va',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  operations: 'Operations and Compliance',
  client_relations: 'Client Relations',
  incorporation_va: 'Incorporation VA',
  marketing_va: 'Marketing and Website VA',
};

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<StaffRole, string> = {
  super_admin: '/admin',
  operations: '/admin/documents',
  client_relations: '/admin/clients',
  incorporation_va: '/admin',
  marketing_va: '/admin',
};

const LEGACY_ROLE: Record<string, StaffRole> = { admin: 'super_admin', staff: 'incorporation_va' };

export function toStaffRole(dbRole: string | null | undefined): StaffRole | null {
  if (!dbRole) return null;
  if ((STAFF_ROLES as readonly string[]).includes(dbRole)) return dbRole as StaffRole;
  return LEGACY_ROLE[dbRole] ?? null;
}

/** `all` = every client; `assigned` = only clients assigned to this person. */
export type Scope = 'all' | 'assigned';

export type Capability =
  | 'clients.view'
  | 'clients.assign' // choose which VA looks after a client
  | 'kyc.view' // passport and ID images, view only
  | 'documents.review' // request, accept and reject
  | 'stage.change' // everything up to Filed with registry
  | 'stage.incorporate' // mark Incorporated
  | 'stage.deliver' // mark Documents delivered
  | 'stage.cancel' // Cancelled and Refunded
  | 'audit.view'
  | 'staff.manage'
  | 'prices.edit'
  | 'system.view'
  | 'reports.view'
  | 'website.manage'
  | 'website.review';

const ALL_CLIENTS: Partial<Record<StaffRole, Scope>> = {
  super_admin: 'all',
  operations: 'all',
  client_relations: 'all',
  incorporation_va: 'assigned',
};

// Open decision (Abdullah and Farooq): may an Incorporation VA mark Incorporated? The requirements
// leave it open for Incorporated and name the VA for Delivered. It is on for now because the Phase 1
// acceptance test has a VA take an application all the way to Documents delivered. To take it away,
// delete the incorporation_va line under `stage.incorporate`.
const MATRIX: Record<Capability, Partial<Record<StaffRole, Scope>>> = {
  'clients.view': ALL_CLIENTS,
  'clients.assign': { super_admin: 'all', operations: 'all' },
  'kyc.view': ALL_CLIENTS,
  'documents.review': ALL_CLIENTS,
  'stage.change': ALL_CLIENTS,
  'stage.incorporate': { super_admin: 'all', operations: 'all', incorporation_va: 'assigned' },
  'stage.deliver': { super_admin: 'all', operations: 'all', incorporation_va: 'assigned' },
  'stage.cancel': { super_admin: 'all' },
  'audit.view': { super_admin: 'all', operations: 'all' },
  'staff.manage': { super_admin: 'all' },
  'prices.edit': { super_admin: 'all' },
  'system.view': { super_admin: 'all' },
  'reports.view': { super_admin: 'all', client_relations: 'all', marketing_va: 'all' },
  'website.manage': { super_admin: 'all', marketing_va: 'all' },
  'website.review': { super_admin: 'all', operations: 'all' },
};

/** The scope this role has for a capability, or null when it has none. */
export function accessFor(dbRole: string | null | undefined, capability: Capability): Scope | null {
  const role = toStaffRole(dbRole);
  return (role && MATRIX[capability][role]) || null;
}

/**
 * May this person use `capability` on a client whose assigned VA is `assignedTo`?
 * Roles with `all` scope pass; `assigned` scope passes only for the person it is assigned to.
 */
export function canOnClient(
  dbRole: string | null | undefined,
  capability: Capability,
  userId: string,
  assignedTo: string | null | undefined,
): boolean {
  const scope = accessFor(dbRole, capability);
  if (scope === 'all') return true;
  return scope === 'assigned' && !!assignedTo && assignedTo === userId;
}

export function can(dbRole: string | null | undefined, capability: Capability): boolean {
  return accessFor(dbRole, capability) !== null;
}

export const isStaff = (dbRole: string | null | undefined) => toStaffRole(dbRole) !== null;
