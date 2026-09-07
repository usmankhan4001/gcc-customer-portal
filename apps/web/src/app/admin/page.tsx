export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">System Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Total Users</p>
          <p className="text-2xl font-bold text-text">—</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Active Contacts</p>
          <p className="text-2xl font-bold text-text">—</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">Open Deals</p>
          <p className="text-2xl font-bold text-text">—</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-sm text-text-secondary">API Calls (24h)</p>
          <p className="text-2xl font-bold text-text">—</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-bg p-6">
          <h2 className="text-lg font-semibold text-text mb-4">System Health</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Database</span>
              <span className="text-sm font-medium text-success">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Email Provider</span>
              <span className="text-sm font-medium text-success">Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">WhatsApp API</span>
              <span className="text-sm font-medium text-success">Configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Storage (R2)</span>
              <span className="text-sm font-medium text-success">Configured</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/admin/users" className="block rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary">
              Manage Users
            </a>
            <a href="/admin/api-keys" className="block rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary">
              Create API Key
            </a>
            <a href="/admin/webhooks" className="block rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary">
              Configure Webhooks
            </a>
            <a href="/admin/integrations" className="block rounded-md border border-border px-4 py-2 text-sm hover:bg-bg-secondary">
              Set Up Integrations
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
