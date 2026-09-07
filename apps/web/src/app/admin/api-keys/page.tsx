import { Key } from 'lucide-react'

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">API Keys</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Generate New Key
        </button>
      </div>

      <div className="rounded-lg border border-border bg-bg">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-text-secondary">Manage API keys for external integrations.</p>
        </div>
        <div className="p-8 text-center text-text-secondary">
          <Key className="mx-auto h-12 w-12 opacity-50" />
          <p className="mt-2">No API keys configured. Generate your first key.</p>
        </div>
      </div>
    </div>
  )
}
