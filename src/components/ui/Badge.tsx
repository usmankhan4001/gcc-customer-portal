import React from 'react';
import { Badge as HeroBadge, type BadgeProps as HeroBadgeProps } from '@heroui/react';

type HeroBadgeColor = HeroBadgeProps['color'];
type HeroBadgeVariant = HeroBadgeProps['variant'];

export interface BadgeProps extends Omit<HeroBadgeProps, 'color' | 'variant'> {
  variant?: 'orange' | 'navy' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const colorMap: Record<string, HeroBadgeColor> = {
  orange: 'warning',
  navy: 'default',
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'accent',
};

const variantMap: Record<string, HeroBadgeVariant> = {
  orange: 'soft',
  navy: 'soft',
  success: 'soft',
  error: 'soft',
  warning: 'soft',
  info: 'soft',
};

export function Badge({
  variant = 'orange',
  size = 'sm',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <HeroBadge
      {...props}
      color={colorMap[variant] || 'default'}
      variant={variantMap[variant] || 'soft'}
      size={size}
      className={className}
    >
      {children}
    </HeroBadge>
  );
}

export default Badge;
