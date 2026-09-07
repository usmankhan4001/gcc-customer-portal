export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Database</h1>

      <div className="rounded-lg border border-border bg-bg p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Schema Information</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Database</span>
            <span className="text-sm font-medium text-text">PostgreSQL 16</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Tables</span>
            <span className="text-sm font-medium text-text">20+</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">ORM</span>
            <span className="text-sm font-medium text-text">Drizzle</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Migrations</span>
            <span className="text-sm font-medium text-text">Current</span>
          </div>
        </div>
      </div>
    </div>
  )
}
