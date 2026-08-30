import React from 'react';
import {
  Card as HeroCard,
  type CardProps as HeroCardProps,
} from '@heroui/react';

type HeroCardVariant = HeroCardProps['variant'];

export interface CardProps extends Omit<HeroCardProps, 'variant'> {
  variant?: 'default' | 'flat' | 'bordered' | 'orange' | 'navy';
  padded?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantMap: Record<string, HeroCardVariant> = {
  default: 'default',
  flat: 'transparent',
  bordered: 'secondary',
  orange: 'default',
  navy: 'secondary',
};

const paddedClass: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  padded,
  padding,
  interactive = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const resolvedPadded = padded || padding || 'md';
  const extraClass = [
    paddedClass[resolvedPadded] || '',
    interactive ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <HeroCard
      {...props}
      variant={variantMap[variant] || 'default'}
      className={extraClass}
    >
      {children}
    </HeroCard>
  );
}

Card.Header = HeroCard.Header;
Card.Title = HeroCard.Title;
Card.Description = HeroCard.Description;
Card.Content = HeroCard.Content;
Card.Footer = HeroCard.Footer;

export default Card;
