'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ListItemProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export default function ListItem({
  icon,
  iconBg = 'var(--color-brand-orange-lt)',
  title,
  description,
  trailing,
  badge,
  href,
  onClick,
  interactive = true,
}: ListItemProps) {
  const content = (
    <div
      className={`list-item ${interactive ? 'list-item-interactive' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick || href ? 'pointer' : 'default' }}
    >
      {icon && (
        <div className="list-item-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <div className="list-item-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="list-item-title">{title}</span>
          {badge}
        </div>
        {description && <div className="list-item-desc">{description}</div>}
      </div>
      <div className="list-item-trailing">
        {trailing || (href ? <ChevronRight size={16} color="var(--color-text-muted)" /> : null)}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </a>
    );
  }

  return content;
}
