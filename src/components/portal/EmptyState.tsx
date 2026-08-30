import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Shared empty-state treatment — previously every screen either
 * improvised its own or had none at all (an empty vault, an empty
 * notification list, etc. rendered nothing considered).
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
