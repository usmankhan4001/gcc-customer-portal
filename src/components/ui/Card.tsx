'use client';

import React from 'react';

type CardVariant = 'default' | 'flat' | 'orange' | 'navy' | 'bordered';
type CardPadded = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padded?: CardPadded;
  interactive?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  flat: 'card-flat',
  orange: 'card-orange',
  navy: 'card-navy',
  bordered: 'card-bordered',
};

const PADDED_CLASSES: Record<CardPadded, string> = {
  none: '',
  sm: 'card-padded-sm',
  md: 'card-padded',
  lg: 'card-padded-lg',
};

export default function Card({
  variant = 'default',
  padded = 'md',
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`card ${VARIANT_CLASSES[variant]} ${PADDED_CLASSES[padded]} ${interactive ? 'card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
