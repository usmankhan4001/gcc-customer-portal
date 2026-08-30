'use client';

import React from 'react';
import Link from 'next/link';
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
      className={`list-item ${interactive ? 'list-item-interactive' : ''} ${onClick || href ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick && !href ? 'button' : undefined}
      tabIndex={onClick && !href ? 0 : undefined}
      onKeyDown={onClick && !href ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {icon && (
        <div className="list-item-icon" style={{ backgroundColor: iconBg } as React.CSSProperties}>
          {icon}
        </div>
      )}
      <div className="list-item-content">
        <div className="list-item-title-row">
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
      <Link href={href} className="list-item-link">
        {content}
      </Link>
    );
  }

  return content;
}
