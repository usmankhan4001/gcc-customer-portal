import { Users } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Users</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Add User
        </button>
      </div>

      <div className="rounded-lg border border-border bg-bg">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-text-secondary">User management will be connected to the database.</p>
        </div>
        <div className="p-8 text-center text-text-secondary">
          <Users className="mx-auto h-12 w-12 opacity-50" />
          <p className="mt-2">No users found. Create the first user account.</p>
        </div>
      </div>
    </div>
  )
}
