export default function RolesPage() {
  const roles = [
    { name: 'Super Admin', description: 'Full system access', users: 1 },
    { name: 'Admin', description: 'Administrative access', users: 0 },
    { name: 'Staff', description: 'Standard staff access', users: 0 },
    { name: 'Viewer', description: 'Read-only access', users: 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Roles & Permissions</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Create Role
        </button>
      </div>

      <div className="rounded-lg border border-border bg-bg">
        <div className="divide-y divide-border">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <h3 className="font-medium text-text">{role.name}</h3>
                <p className="text-sm text-text-secondary">{role.description}</p>
              </div>
              <span className="text-sm text-text-secondary">{role.users} users</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
