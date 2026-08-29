'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'sand' | 'navy' | 'blue-lt' | 'orange-lt';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Card({
  variant = 'surface',
  hoverable = false,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'sand':
        return 'card-sand';
      case 'navy':
        return 'card-navy';
      case 'blue-lt':
        return 'card-blue-lt';
      case 'orange-lt':
        return 'card-orange-lt';
      default:
        return '';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return 'p-0';
      case 'sm':
        return 'p-sm';
      case 'lg':
        return 'p-lg';
      default:
        return 'p-md';
    }
  };

  return (
    <div
      className={`card ${getVariantClass()} ${hoverable ? 'card-hover' : ''} ${getPaddingClass()} ${className}`}
      {...props}
    >
      {children}

      <style jsx>{`
        .p-0 {
          padding: 0;
        }
        .p-sm {
          padding: 16px;
        }
        .p-md {
          padding: 24px 28px;
        }
        .p-lg {
          padding: 36px 32px;
        }
      `}</style>
    </div>
  );
}
