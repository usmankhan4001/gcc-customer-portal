import { AdminLayoutShell } from './AdminLayoutShell';

// Access is enforced by src/middleware.ts (admin and super_admin only); this is the visual shell.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
