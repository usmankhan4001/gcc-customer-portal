export default function HealthPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">System Health</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">Database</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">PostgreSQL 16</p>
          <p className="text-xs text-text-secondary mt-2">Response time: —</p>
        </div>

        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">Email (SES)</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">Amazon SES</p>
          <p className="text-xs text-text-secondary mt-2">Last send: —</p>
        </div>

        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">WhatsApp API</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">Meta Cloud API</p>
          <p className="text-xs text-text-secondary mt-2">Quality: —</p>
        </div>

        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">Storage (R2)</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">Cloudflare R2</p>
          <p className="text-xs text-text-secondary mt-2">Usage: —</p>
        </div>

        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">Outbox Queue</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">Background jobs</p>
          <p className="text-xs text-text-secondary mt-2">Pending: — | Processing: —</p>
        </div>

        <div className="rounded-lg border border-border bg-bg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">Worker</h3>
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <p className="text-sm text-text-secondary mt-1">Background worker</p>
          <p className="text-xs text-text-secondary mt-2">Last tick: —</p>
        </div>
      </div>
    </div>
  )
}
