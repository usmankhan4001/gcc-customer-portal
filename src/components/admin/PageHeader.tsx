import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

// Port of the gccstartup-cms admin PageHeader. `pinnedActions` stay inline on desktop and pin above the
// phone bottom bar on a long form.
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  actions,
  pinnedActions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  pinnedActions?: ReactNode;
}) {
  return (
    <div className="admin-page-header">
      <div>
        {backHref && (
          <Link href={backHref} className="admin-page-header-back">
            <ArrowLeft size={16} /> {backLabel}
          </Link>
        )}
        {eyebrow && <span className="eyebrow admin-page-eyebrow">{eyebrow}</span>}
        <h1 className="admin-page-header-title">{title}</h1>
        {subtitle && <p className="admin-page-header-subtitle">{subtitle}</p>}
      </div>
      {(actions || pinnedActions) && (
        <div className="admin-page-header-actions">
          {actions}
          {pinnedActions && <div className="admin-pin-group">{pinnedActions}</div>}
        </div>
      )}
    </div>
  );
}
