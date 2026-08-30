'use client';

import React from 'react';
import { Button as HeroButton, type ButtonProps as HeroButtonProps } from '@heroui/react';
import { Loader2 } from 'lucide-react';

type HeroButtonVariant = HeroButtonProps['variant'];

export interface ButtonProps extends Omit<HeroButtonProps, 'variant' | 'isDisabled'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}

const variantMap: Record<string, HeroButtonVariant> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  navy: 'primary',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <HeroButton
      {...props}
      variant={variantMap[variant] || 'primary'}
      size={size}
      fullWidth={fullWidth}
      isDisabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </HeroButton>
  );
}

export default Button;
