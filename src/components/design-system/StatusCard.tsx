'use client';

import React from 'react';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'orange' | 'blue' | 'success' | 'navy';
}

export default function StatusCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}: StatusCardProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--color-surface)', border: '1px solid var(--color-border)' },
    orange: { background: 'var(--color-brand-orange-lt)', border: '1px solid #FCD9C7' },
    blue: { background: 'var(--color-brand-blue-lt)', border: '1px solid #D8E2FD' },
    success: { background: 'var(--color-success-lt)', border: '1px solid #BBF7D0' },
    navy: { background: 'var(--color-brand-navy)', border: '1px solid var(--color-brand-navy-dk)', color: 'white' },
  };

  return (
    <div
      style={{
        ...variantStyles[variant],
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: variant === 'navy' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </span>
        {icon}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: variant === 'navy' ? 'white' : 'var(--color-brand-navy)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <span
          style={{
            fontSize: 12,
            color: variant === 'navy' ? 'rgba(255,255,255,0.6)' : 'var(--color-text-tertiary)',
          }}
        >
          {subtitle}
        </span>
      )}
      {trend && trendValue && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
            }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
