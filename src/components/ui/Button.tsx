'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  shimmer = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'outline':
        return 'btn-outline';
      case 'danger':
        return 'btn-danger';
      case 'navy':
        return 'btn-navy';
      default:
        return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'btn-sm';
      case 'lg':
        return 'btn-lg';
      default:
        return '';
    }
  };

  return (
    <button
      className={`btn ${getVariantClass()} ${getSizeClass()} ${shimmer ? 'btn-shimmer' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" />
      ) : (
        <>
          {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
        </>
      )}

      <style jsx>{`
        .btn-navy {
          background: var(--navy);
          color: #FFFFFF;
          border-color: var(--navy);
        }
        .btn-navy:hover {
          background: var(--orange);
          border-color: var(--orange);
        }
        .btn-danger {
          background: var(--error);
          color: #FFFFFF;
          border-color: var(--error);
        }
        .btn-danger:hover {
          background: #B91C1C;
        }
        .btn-icon-left {
          display: inline-flex;
          align-items: center;
          margin-right: 6px;
        }
        .btn-icon-right {
          display: inline-flex;
          align-items: center;
          margin-left: 6px;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
