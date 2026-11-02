import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Shared empty-state treatment, on the admin `cl-empty` surface. */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="cl-empty">
      {icon}
      <p style={{ color: 'var(--text)', fontWeight: 700 }}>{title}</p>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
