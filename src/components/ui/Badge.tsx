'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'navy' | 'sand' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = 'navy',
  icon,
  className = '',
}: BadgeProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'orange':
        return 'badge-orange';
      case 'blue':
        return 'badge-blue';
      case 'sand':
        return 'badge-sand';
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'error':
        return 'badge-error';
      default:
        return 'badge-navy';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>

      <style jsx>{`
        .badge-warning {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }
        .badge-error {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }
        .badge-icon {
          display: inline-flex;
          align-items: center;
          margin-right: 4px;
        }
      `}</style>
    </span>
  );
}
