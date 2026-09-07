import { ScrollText } from 'lucide-react'

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Audit Log</h1>

      <div className="rounded-lg border border-border bg-bg">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-text-secondary">Track all system actions and changes.</p>
        </div>
        <div className="p-8 text-center text-text-secondary">
          <ScrollText className="mx-auto h-12 w-12 opacity-50" />
          <p className="mt-2">No audit entries yet. Actions will appear here.</p>
        </div>
      </div>
    </div>
  )
}
